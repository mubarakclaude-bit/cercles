// Procedural isometric home in the style of an architect's white cutaway model:
// thick matte-white walls, soft shadows, crisp edges. Each part pops to its own colour
// when the page reaches it, and the whole home turns colourful for the finishing touch.
// No models or image files to download: everything is simple shapes.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  RepeatWrapping,
  RingGeometry,
  Shape,
  ShadowMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { POP } from './director';

/** Squeeze any colour into a narrow band of one pale blue-grey, so the model reads as one white material. */
const _hsl = { h: 0, s: 0, l: 0 };
function tone(hex: string) {
  new Color(hex).getHSL(_hsl);
  return new Color().setHSL(216 / 360, 0.12, Math.min(0.93, 0.835 + (_hsl.l - 0.62) * 0.2));
}

type FadeMat = MeshStandardMaterial | MeshBasicMaterial;
export interface Fade {
  m: FadeMat;
  base: number;
}
export interface PulsePath {
  pts: Vector3[];
  len: number[];
  total: number;
}
export interface Tint {
  m: MeshStandardMaterial;
  base: Color;
  to: Color;
}

export function build() {
  const root = new Group();
  const unitBox = new BoxGeometry(1, 1, 1);
  const unitEdges = new EdgesGeometry(unitBox);
  const cyl = new CylinderGeometry(0.5, 0.5, 1, 18);
  const cyl6 = new CylinderGeometry(0.5, 0.5, 1, 6);
  const ico = new IcosahedronGeometry(1, 1);
  const sphere = new SphereGeometry(1, 14, 12);

  /* ---------- materials ---------- */
  const solid = new Map<string, MeshStandardMaterial>();
  const std = (color: string, extra: Record<string, unknown> = {}) => {
    const key = color + JSON.stringify(extra);
    let m = solid.get(key);
    if (!m) {
      m = new MeshStandardMaterial({ color: tone(color), roughness: 0.95, metalness: 0, ...extra });
      solid.set(key, m);
    }
    return m;
  };
  const fades = {
    walls: [] as Fade[],
    skin: [] as Fade[],
    glass: [] as Fade[],
    roof: [] as Fade[],
    furn: [] as Fade[],
    curt: [] as Fade[],
    util: [] as Fade[],
  };
  const fadeMat = (list: Fade[], color: string, base = 1, extra: Record<string, unknown> = {}) => {
    const m = new MeshStandardMaterial({ color: tone(color), roughness: 0.95, metalness: 0, transparent: true, ...extra });
    list.push({ m, base });
    return m;
  };
  const fadeRaw = (list: Fade[], color: string, base = 1, extra: Record<string, unknown> = {}) => {
    const m = new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, transparent: true, ...extra });
    list.push({ m, base });
    return m;
  };
  const fadeBasic = (list: Fade[], color: string, base = 1) => {
    const m = new MeshBasicMaterial({ color, transparent: true });
    list.push({ m, base });
    return m;
  };

  // Parts that pop to a colour when the page talks about them (key = service slug, or a paint-only key).
  const tints: Record<string, Tint[]> = {};
  const reg = (key: string, color: string | undefined, ...ms: MeshStandardMaterial[]) => {
    const to = new Color(color ?? POP[key] ?? '#2f6bff');
    (tints[key] ||= []).push(...ms.map((m) => ({ m, base: m.color.clone(), to })));
  };

  const box = (parent: Group, w: number, h: number, d: number, x: number, y: number, z: number, material: Material, cast = true, receive = true) => {
    const m = new Mesh(unitBox, material);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  };
  const cylinder = (parent: Group, r: number, h: number, x: number, y: number, z: number, material: Material, cast = true, six = false) => {
    const m = new Mesh(six ? cyl6 : cyl, material);
    m.scale.set(r * 2, h, r * 2);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const ball = (parent: Group, r: number, x: number, y: number, z: number, material: Material, cast = true, geo: BufferGeometry = ico) => {
    const m = new Mesh(geo, material);
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const V = (x: number, y: number, z: number) => new Vector3(x, y, z);

  /* ---------- groups ---------- */
  const stage = new Group();
  root.add(stage);
  const gGround = new Group();
  const gHouse = new Group();
  const gInside = new Group();
  const gUpper = new Group(); // upper floor and everything on it: lifts away on its own
  const gRoof = new Group();
  const gUtil = new Group();
  const gGarden = new Group();
  stage.add(gGround, gHouse, gInside, gUpper, gRoof, gUtil, gGarden);

  const FH = 3.3;
  const T = 0.45;

  /* ---------- ground slab ---------- */
  box(gGround, 22, 1.5, 19, 0, -0.85, 0, std('#eceff4'), true, true);
  const lawnMat = std('#f5f7fa');
  reg('lawn', '#b9e6a0', lawnMat);
  box(gGround, 22, 0.2, 19, 0, -0.1, 0, lawnMat, false, true);
  const rings: { mesh: Mesh }[] = [];
  [6.2, 9.2, 12.2].forEach((r) => {
    const m = new Mesh(new RingGeometry(r - 0.1, r + 0.1, 160), new MeshBasicMaterial({ color: '#292a75', transparent: true, opacity: 0.1, side: DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.03;
    gGround.add(m);
    rings.push({ mesh: m });
  });
  const pageShadow = new Mesh(new PlaneGeometry(30, 27), new ShadowMaterial({ opacity: 0.1 }));
  pageShadow.rotation.x = -Math.PI / 2;
  pageShadow.position.y = -2.6;
  pageShadow.receiveShadow = true;
  root.add(pageShadow);

  /* ---------- walls: thick, with edges; front and right ones can drop for a cutaway ---------- */
  const wallMain = fadeMat(fades.walls, '#f8f9fb');
  const wallWing = fadeMat(fades.walls, '#f8f9fb');
  reg('walls', '#ffd9b3', wallMain);
  reg('wing', '#b5ebe1', wallWing);
  const edgeMat = new LineBasicMaterial({ color: '#6d7d99', transparent: true, opacity: 0.3 });
  const withEdges = (m: Mesh) => {
    m.add(new LineSegments(unitEdges, edgeMat));
    return m;
  };
  const cuts: Group[] = [];
  const cutGroup = (host: Group, baseY: number) => {
    const g = new Group();
    g.position.y = baseY;
    host.add(g);
    cuts.push(g);
    return g;
  };
  // Ground floor
  const cF0 = cutGroup(gHouse, 0);
  const cR0 = cutGroup(gHouse, 0);
  withEdges(box(cF0, 9, FH, T, -1.5, FH / 2, 3.6 - T / 2, wallMain));
  withEdges(box(cR0, T, FH, 7.2, 3 - T / 2, FH / 2, 0, wallMain));
  withEdges(box(gHouse, 9, FH, T, -1.5, FH / 2, -3.6 + T / 2, wallMain));
  withEdges(box(gHouse, T, FH, 7.2, -6 + T / 2, FH / 2, 0, wallMain));
  withEdges(box(cF0, 5.2, FH, T, 5.6, FH / 2, 2.4 - T / 2, wallWing));
  withEdges(box(cR0, T, FH, 6, 8.2 - T / 2, FH / 2, -0.6, wallWing));
  withEdges(box(gHouse, 5.2, FH, T, 5.6, FH / 2, -3.6 + T / 2, wallWing));
  // Upper floor
  const cF1 = cutGroup(gUpper, FH);
  const cR1 = cutGroup(gUpper, FH);
  withEdges(box(cF1, 9, FH, T, -1.5, FH / 2, 3.6 - T / 2, wallMain));
  withEdges(box(cR1, T, FH, 7.2, 3 - T / 2, FH / 2, 0, wallMain));
  withEdges(box(gUpper, 9, FH, T, -1.5, FH * 1.5, -3.6 + T / 2, wallMain));
  withEdges(box(gUpper, T, FH, 7.2, -6 + T / 2, FH * 1.5, 0, wallMain));

  // Floors, slabs
  const floorMat = std('#eceff3');
  reg('interior-works', undefined, floorMat);
  box(gHouse, 9, 0.2, 7.2, -1.5, 0.1, 0, floorMat, false, true);
  box(gHouse, 5.2, 0.2, 6, 5.6, 0.1, -0.6, floorMat, false, true);
  const slab2 = std('#e3e8ee');
  withEdges(box(gUpper, 9.2, 0.3, 7.4, -1.5, FH, 0, slab2, true, true));
  const deck = fadeMat(fades.roof, '#eef1f5');
  withEdges(box(gRoof, 9.4, 0.3, 7.6, -1.5, 2 * FH + 0.02, 0, deck, true, true));

  // Wing terrace: slab, parapet, waterproof membrane, water tank
  withEdges(box(gHouse, 5.6, 0.3, 6.4, 5.6, FH + 0.12, -0.6, std('#f3f6f9')));
  const membrane = std('#e8ecf2');
  reg('roofing', undefined, membrane);
  box(gHouse, 5.0, 0.06, 5.8, 5.6, FH + 0.3, -0.6, membrane, false, true);
  const parapet = std('#e1e6ed');
  reg('wing', '#ff9a7a', parapet);
  withEdges(box(gHouse, 5.6, 0.6, 0.24, 5.6, FH + 0.6, 2.5, parapet));
  withEdges(box(gHouse, 5.6, 0.6, 0.24, 5.6, FH + 0.6, -3.7, parapet));
  withEdges(box(gHouse, 0.24, 0.6, 6.4, 8.3, FH + 0.6, -0.6, parapet));
  const tankMat = std('#e6ebf1');
  reg('plumbing', undefined, tankMat);
  cylinder(gHouse, 0.8, 1.3, 6.6, FH + 1.0, -1.8, tankMat);
  cylinder(gHouse, 0.85, 0.12, 6.6, FH + 1.7, -1.8, std('#dde3ea'));

  /* ---------- roof ---------- */
  const tc = document.createElement('canvas');
  tc.width = 64;
  tc.height = 128;
  const tx = tc.getContext('2d')!;
  tx.fillStyle = '#eef1f6';
  tx.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 8; i++) {
    tx.fillStyle = i % 2 ? 'rgba(255,255,255,.7)' : 'rgba(70,90,130,.1)';
    tx.fillRect(0, i * 16, 64, 7);
  }
  tx.fillStyle = 'rgba(70,90,130,.1)';
  for (let i = 0; i < 4; i++) tx.fillRect(i * 16, 0, 2, 128);
  const tileTex = new CanvasTexture(tc);
  tileTex.colorSpace = SRGBColorSpace;
  tileTex.wrapS = tileTex.wrapT = RepeatWrapping;
  tileTex.repeat.set(6, 2.6);
  const roofMat = fadeMat(fades.roof, '#ffffff', 1, { map: tileTex });
  roofMat.color.set('#ffffff');
  reg('roofing', undefined, roofMat);
  const E = 2 * FH + 0.18;
  const RISE = 2.7;
  const HALF = 4.25;
  const L = Math.hypot(HALF, RISE);
  const th = Math.atan2(RISE, HALF);
  box(gRoof, 10.4, 0.28, L, -1.5, E + RISE / 2, HALF / 2, roofMat).rotation.x = th;
  box(gRoof, 10.4, 0.28, L, -1.5, E + RISE / 2, -HALF / 2, roofMat).rotation.x = -th;
  const ridgeMat = fadeMat(fades.roof, '#dfe5ec');
  reg('roofing', undefined, ridgeMat);
  box(gRoof, 10.6, 0.22, 0.42, -1.5, E + RISE + 0.12, 0, ridgeMat);
  const gableShape = new Shape();
  gableShape.moveTo(-HALF + 0.2, E);
  gableShape.lineTo(HALF - 0.2, E);
  gableShape.lineTo(0, E + RISE);
  gableShape.closePath();
  const gableGeo = new ExtrudeGeometry(gableShape, { depth: T, bevelEnabled: false });
  gableGeo.rotateY(Math.PI / 2);
  const gableMat = fadeMat(fades.roof, '#f8f9fb');
  reg('walls', '#ffd9b3', gableMat);
  for (const x of [-6, 3 - T]) {
    const g = new Mesh(gableGeo, gableMat);
    g.position.set(x, 0, 0);
    g.castShadow = true;
    g.receiveShadow = true;
    gRoof.add(g);
  }

  /* ---------- facade ---------- */
  const claddingA = fadeMat(fades.skin, '#e6ebf2');
  const claddingB = fadeMat(fades.skin, '#d8dfe8');
  reg('acp-facade', undefined, claddingA, claddingB);
  for (let i = 0; i < 11; i++) box(gUpper, 0.36, 2.9, 0.12, -5.75 + i * 0.4, FH + 1.75, 3.6 + 0.06, i % 2 ? claddingB : claddingA);

  const frameMat = fadeMat(fades.skin, '#d5dce5');
  reg('aluminium-fabrication', undefined, frameMat);
  const glassMat = fadeMat(fades.glass, '#eaf3fc', 0.55, { roughness: 0.1 });
  const sillMat = std('#f2f5f8');
  const curtainMats: MeshStandardMaterial[] = [];

  const win = (host: Group, curtHost: Group, x: number, y: number, w: number, h: number, face: number, withCurtain: boolean, axis: 'z' | 'x' = 'z') => {
    const g = new Group();
    box(g, w, h, 0.18, 0, 0, 0, frameMat, true, false);
    box(g, w - 0.26, h - 0.26, 0.05, 0, 0, 0.11, glassMat, false, false);
    box(g, 0.08, h - 0.1, 0.08, 0, 0, 0.13, frameMat, false, false);
    box(g, w + 0.24, 0.12, 0.3, 0, -h / 2 - 0.05, 0.08, sillMat, false, false);
    g.position.set(x, y, face + 0.1);
    if (axis === 'x') {
      g.rotation.y = Math.PI / 2;
      g.position.set(face + 0.1, y, x);
    }
    host.add(g);
    if (withCurtain) {
      const c = new Group();
      const fw = (w * 0.3) / 5;
      for (const side of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          const mat = fadeMat(fades.curt, i % 2 ? '#f9fafc' : '#e1e7f0');
          curtainMats.push(mat);
          box(c, fw * 1.05, h - 0.1, 0.12, side * (w / 2 - 0.22 - i * fw), 0, (i % 2 ? 0.06 : -0.06) - 0.45, mat, false, false);
        }
      }
      const rod = fadeMat(fades.curt, '#d3d9e2');
      curtainMats.push(rod);
      box(c, w + 0.34, 0.07, 0.07, 0, h / 2 - 0.02, -0.45, rod, false, false);
      c.position.copy(g.position);
      c.position.z -= 0.1;
      if (axis === 'x') {
        c.rotation.y = Math.PI / 2;
        c.position.x -= 0.1;
        c.position.z += 0.1;
      }
      curtHost.add(c);
    }
  };
  win(gHouse, gInside, -2.4, 1.8, 5.6, 2.2, 3.6, true);
  win(gUpper, gUpper, 1.0, FH + 1.95, 2.4, 1.8, 3.6, true);
  win(gHouse, gInside, 5.6, 1.75, 3.0, 2.0, 2.4, true);
  win(gUpper, gUpper, 0.2, FH + 1.95, 2.2, 1.8, 3.0, true, 'x');

  box(gHouse, 1.2, 2.5, 0.16, 0.8, 1.35, 3.6 + 0.04, frameMat, true, false);
  box(gHouse, 0.08, 0.45, 0.07, 1.25, 1.3, 3.74, sillMat, false, false);
  withEdges(box(gHouse, 2.4, 0.18, 1.3, 0.8, 2.85, 4.3, sillMat, true, false));
  curtainMats.length && reg('curtains', undefined, ...curtainMats);

  // Balcony with aluminium railing
  withEdges(box(gUpper, 2.9, 0.26, 1.6, 1.0, FH + 0.04, 4.4, sillMat));
  const rail = fadeMat(fades.skin, '#d2d9e2');
  reg('aluminium-fabrication', undefined, rail);
  for (let i = 0; i < 8; i++) box(gUpper, 0.05, 1.0, 0.05, -0.35 + i * 0.4, FH + 0.68, 5.1, rail, false, false);
  box(gUpper, 2.95, 0.07, 0.08, 1.0, FH + 1.2, 5.1, rail, false, false);
  box(gUpper, 0.08, 0.07, 1.6, -0.45, FH + 1.2, 4.4, rail, false, false);
  box(gUpper, 0.08, 0.07, 1.6, 2.45, FH + 1.2, 4.4, rail, false, false);
  for (const x of [-0.45, 2.45]) box(gUpper, 0.05, 1.0, 0.05, x, FH + 0.68, 4.4 + 0.7, rail, false, false);

  // Rainwater gutters (ride up with the roof) and downpipes
  const gutter = fadeMat(fades.skin, '#dde4ec');
  reg('aluminium-gutters', undefined, gutter);
  box(gRoof, 10.6, 0.24, 0.32, -1.5, E - 0.08, HALF + 0.12, gutter, false, false);
  box(gRoof, 10.6, 0.24, 0.32, -1.5, E - 0.08, -HALF - 0.12, gutter, false, false);
  for (const x of [-6.5, 3.5]) {
    cylinder(gHouse, 0.1, FH, x, FH / 2, HALF + 0.12, gutter, false, true);
    cylinder(gUpper, 0.1, FH, x, FH * 1.5, HALF + 0.12, gutter, false, true);
  }

  /* ---------- interior ---------- */
  const fm = (key: string, c: string) => {
    const m = fadeMat(fades.furn, c);
    reg(key, undefined, m);
    return m;
  };
  const accent = fadeMat(fades.furn, '#f2f4f8');
  reg('painting-texturing', undefined, accent);
  box(gInside, 7.6, 2.95, 0.07, -1.5, 1.6, -3.1, accent, false, false);
  const rug = new Mesh(cyl, fm('interior-works', '#f7f9fb'));
  rug.scale.set(4.0, 0.05, 4.0);
  rug.position.set(-2.6, 0.24, 0.6);
  rug.receiveShadow = true;
  gInside.add(rug);
  const sofa = fm('sofa-making', '#e0e6ee');
  const cush = fm('sofa-making', '#f3f5f9');
  box(gInside, 3.4, 0.5, 1.05, -3.6, 0.5, -2.45, sofa);
  box(gInside, 3.4, 0.9, 0.3, -3.6, 1.05, -2.95, sofa);
  box(gInside, 0.34, 0.75, 1.05, -5.2, 0.75, -2.45, sofa);
  box(gInside, 0.34, 0.75, 1.05, -2.0, 0.75, -2.45, sofa);
  box(gInside, 1.05, 0.5, 1.9, -5.0, 0.5, -0.95, sofa);
  box(gInside, 0.65, 0.5, 0.2, -4.4, 0.98, -2.7, cush);
  box(gInside, 0.65, 0.5, 0.2, -2.8, 0.98, -2.7, cush);
  const wood = fm('furniture-works', '#d5dce5');
  const woodD = fm('furniture-works', '#c5ced9');
  const lightF = fm('furniture-works', '#f0f3f7');
  box(gInside, 1.5, 0.1, 0.9, -2.6, 0.64, 0.7, woodD);
  for (const [x, z] of [[-3.25, 0.35], [-1.95, 0.35], [-3.25, 1.05], [-1.95, 1.05]] as const) box(gInside, 0.09, 0.42, 0.09, x, 0.42, z, woodD, false);
  box(gInside, 1.0, 0.5, 1.0, -0.2, 0.45, 0.8, cush);
  box(gInside, 1.0, 0.7, 0.22, 0.1, 0.95, 0.8, cush);
  box(gInside, 2.0, 0.1, 1.2, 0.9, 0.88, -1.7, wood);
  for (const [x, z] of [[0.0, -2.25], [1.8, -2.25], [0.0, -1.15], [1.8, -1.15]] as const) box(gInside, 0.09, 0.78, 0.09, x, 0.55, z, woodD, false);
  for (const [x, z] of [[0.45, -2.5], [1.35, -2.5], [0.45, -0.9], [1.35, -0.9]] as const) box(gInside, 0.5, 0.45, 0.5, x, 0.48, z, lightF);
  box(gInside, 0.75, 0.98, 2.0, 2.1, 0.58, -1.8, woodD);
  box(gInside, 0.75, 0.5, 2.0, 2.1, 2.4, -1.8, wood);
  ball(gInside, 0.35, -5.2, 0.95, 2.5, fm('landscaping', '#e4eaf1'));
  cylinder(gInside, 0.3, 0.6, -5.2, 0.3, 2.5, lightF);
  const lampMat = fm('interior-works', '#f8fafc');
  const cord = fm('interior-works', '#d2d8e0');
  for (const [x, z] of [[-2.6, 0.6], [0.9, -1.7]] as const) {
    cylinder(gUpper, 0.03, 0.9, x, FH - 0.55, z, cord, false, true);
    cylinder(gUpper, 0.34, 0.24, x, FH - 1.1, z, lampMat, false);
  }
  const stair = fm('interior-works', '#d8dee7');
  for (let i = 0; i < 9; i++) box(gInside, 1.0, 0.2, 0.38, 1.6, 0.2 + i * 0.33, 2.7 - i * 0.37, stair);

  // Upper floor
  const U = FH + 0.15;
  box(gUpper, 2.1, 0.42, 2.4, -3.6, U + 0.21, -2.0, woodD);
  box(gUpper, 2.0, 0.3, 2.3, -3.6, U + 0.58, -2.0, lightF);
  box(gUpper, 2.0, 0.14, 0.7, -3.6, U + 0.82, -2.6, wood);
  box(gUpper, 2.2, 1.2, 0.16, -3.6, U + 0.8, -3.04, wood);
  box(gUpper, 0.55, 0.5, 0.5, -5.1, U + 0.25, -2.7, wood);
  box(gUpper, 0.55, 0.5, 0.5, -2.1, U + 0.25, -2.7, wood);
  box(gUpper, 0.75, 2.7, 2.6, -5.2, U + 1.35, 0.9, wood);
  box(gUpper, 0.06, 2.55, 0.05, -4.82, U + 1.35, 0.9, woodD, false);
  box(gUpper, 0.06, 0.06, 2.5, -4.82, U + 1.35, 0.9, woodD, false);
  cylinder(gUpper, 1.1, 0.05, -2.2, U + 0.04, 0.6, lightF, false);

  /* ---------- wires, pipes and a glowing smart-home hub ---------- */
  const amber = fadeBasic(fades.util, '#ffb020');
  const red = fadeBasic(fades.util, '#ff4d4f');
  const green = fadeBasic(fades.util, '#18c29c');
  const blue = fadeBasic(fades.util, '#1e90ff');
  const ink = fadeBasic(fades.util, '#14154a');
  const up = new Vector3(0, 1, 0);
  const tmpDir = new Vector3();
  const tmpMid = new Vector3();
  const tube = (pts: Vector3[], r: number, mat: Material): PulsePath => {
    const len: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      tmpDir.subVectors(pts[i], pts[i - 1]);
      const l = tmpDir.length();
      len.push(len[i - 1] + l);
      const m = new Mesh(cyl6, mat);
      m.scale.set(r * 2, l, r * 2);
      tmpMid.addVectors(pts[i], pts[i - 1]).multiplyScalar(0.5);
      m.position.copy(tmpMid);
      m.quaternion.copy(new Quaternion().setFromUnitVectors(up, tmpDir.clone().normalize()));
      gUtil.add(m);
      ball(gUtil, r * 1.5, pts[i].x, pts[i].y, pts[i].z, mat, false, sphere);
    }
    return { pts, len, total: len[len.length - 1] };
  };
  const wires: PulsePath[] = [
    tube([V(-5.4, 1.3, 1.6), V(-5.4, 3.0, 1.6), V(-2.6, 3.0, 1.6), V(-2.6, 3.0, 0.6), V(-2.6, 2.1, 0.6)], 0.07, amber),
    tube([V(-2.6, 3.0, 1.6), V(0.9, 3.0, 1.6), V(0.9, 3.0, -1.7), V(0.9, 2.0, -1.7)], 0.07, red),
    tube([V(-5.4, 3.0, 1.6), V(-5.4, 6.3, 1.6), V(-1.0, 6.3, 1.6), V(-1.0, 6.3, -0.5), V(-1.0, 5.3, -0.5)], 0.07, amber),
    tube([V(-5.4, 0.35, -2.7), V(2.3, 0.35, -2.7), V(2.3, 0.35, 2.0), V(-1.0, 0.35, 2.0)], 0.06, green),
  ];
  box(gUtil, 0.34, 0.7, 0.44, -5.4, 1.2, 1.6, ink, false);
  const pipes: PulsePath[] = [
    tube([V(6.6, 5.0, -1.8), V(6.6, 3.7, -1.8), V(7.6, 3.7, -1.8), V(7.6, 0.5, -1.8), V(2.4, 0.5, -1.8), V(2.4, 3.8, -1.8)], 0.1, blue),
    tube([V(7.6, 0.5, -1.8), V(7.6, 0.2, 2.0), V(7.6, 0.2, 7.2), V(-2.0, 0.2, 7.2), V(-6.2, 0.2, 5.9)], 0.1, blue),
    tube([V(2.4, 0.5, -1.8), V(2.4, 1.1, -2.7)], 0.1, blue),
  ];
  box(gUtil, 0.8, 0.55, 0.65, 2.4, 0.8, -2.7, ink, false);
  box(gUtil, 0.65, 0.55, 0.9, 2.4, 4.0, -2.4, ink, false);
  const hubMat = fadeRaw(fades.util, '#2f6bff', 0.5, { emissive: new Color('#2f6bff'), emissiveIntensity: 0.7, roughness: 0.2 });
  const hub = new Mesh(unitBox, hubMat);
  hub.scale.set(1.1, 1.1, 1.1);
  hub.position.set(-2.6, 1.2, 0.6);
  gUtil.add(hub);
  const hubCore = fadeRaw(fades.util, '#ffffff', 0.95, { emissive: new Color('#ffffff'), emissiveIntensity: 0.9 });
  const core = new Mesh(sphere, hubCore);
  core.scale.setScalar(0.28);
  core.position.copy(hub.position);
  gUtil.add(core);
  const pulses: { path: PulsePath; mesh: Mesh; k: number; speed: number }[] = [];
  const addPulses = (paths: PulsePath[], speed: number, r: number) => {
    for (const p of paths) {
      const n = Math.max(2, Math.round(p.total / 3));
      for (let k = 0; k < n; k++) {
        const m = new Mesh(sphere, ink);
        m.scale.setScalar(r);
        gUtil.add(m);
        pulses.push({ path: p, mesh: m, k: k / n, speed });
      }
    }
  };
  addPulses(wires, 0.16, 0.14);
  addPulses(pipes, 0.1, 0.17);

  /* ---------- garden ---------- */
  const stone = std('#eceff3');
  for (let i = 0; i < 5; i++) box(gGarden, 1.3, 0.1, 0.8, 0.8, 0.05, 5.2 + i * 0.95, stone, false);
  box(gGarden, 4.2, 0.08, 7.2, 5.9, 0.04, 6.1, std('#e6eaef'), false);
  for (let i = 1; i < 5; i++) box(gGarden, 4.2, 0.09, 0.04, 5.9, 0.05, 2.5 + i * 1.4, std('#d5dbe2'), false, false);
  const cw = std('#f3f6f9');
  const cap = std('#dde3ea');
  for (const [x0, x1] of [[-10.7, -0.2], [2.0, 3.8], [8.0, 10.7]] as const) {
    withEdges(box(gGarden, x1 - x0, 1.0, 0.26, (x0 + x1) / 2, 0.5, 9.0, cw));
    box(gGarden, x1 - x0 + 0.1, 0.1, 0.36, (x0 + x1) / 2, 1.05, 9.0, cap, false);
  }
  const patio = std('#eef1f5');
  const post = std('#dfe5ec');
  const chair = std('#f4f6f9');
  reg('landscaping', '#e8c79a', patio);
  reg('landscaping', '#c98f5a', post);
  reg('landscaping', '#ff8fa3', chair);
  box(gGarden, 4.2, 0.14, 5.0, -8.3, 0.07, 1.2, patio, false);
  for (const [x, z] of [[-10.2, -1.2], [-6.5, -1.2], [-10.2, 3.6], [-6.5, 3.6]] as const) box(gGarden, 0.18, 2.8, 0.18, x, 1.5, z, post);
  for (let i = 0; i < 10; i++) box(gGarden, 0.1, 0.13, 5.0, -10.2 + i * 0.42, 2.96, 1.2, post, true, false);
  box(gGarden, 4.0, 0.12, 0.14, -8.35, 2.85, -1.2, post, false, false);
  box(gGarden, 4.0, 0.12, 0.14, -8.35, 2.85, 3.6, post, false, false);
  for (const z of [0.2, 2.1]) {
    box(gGarden, 1.3, 0.32, 0.6, -8.6, 0.32, z, chair);
    box(gGarden, 1.3, 0.55, 0.14, -8.6, 0.65, z - 0.32, chair);
  }
  cylinder(gGarden, 0.55, 0.06, -7.4, 0.44, 1.15, chair);
  cylinder(gGarden, 0.07, 0.42, -7.4, 0.23, 1.15, chair);

  const leafA = std('#e3e9ef', { flatShading: true });
  const leafB = std('#d9e1e9', { flatShading: true });
  const leafC = std('#ecf0f5', { flatShading: true });
  const trunk = std('#cfd6df');
  const frond = std('#dde4ec', { flatShading: true, side: DoubleSide });
  reg('landscaping', '#3dbd62', leafA);
  reg('landscaping', '#27a553', leafB);
  reg('landscaping', '#74d36a', leafC);
  reg('landscaping', '#9b6b3c', trunk);
  reg('landscaping', '#1f9d4a', frond);
  const sways: { g: Group; ph: number; amp: number }[] = [];
  const addSway = (g: Group, amp: number) => sways.push({ g, ph: g.position.x * 0.7 + g.position.z * 0.4, amp });
  const roundTree = (x: number, z: number, s: number, m = leafA) => {
    const g = new Group();
    g.position.set(x, 0, z);
    gGarden.add(g);
    cylinder(g, 0.16 * s, 1.7 * s, 0, 0.85 * s, 0, trunk, true, true);
    const blobs: [number, number, number, number][] = [[0, 2.35, 0, 1.15], [0.75, 2.95, -0.2, 0.8], [-0.7, 2.9, 0.35, 0.78], [0.1, 3.6, 0.15, 0.68]];
    blobs.forEach(([bx, by, bz, r], i) => ball(g, r * s, bx * s, by * s, bz * s, i % 2 ? leafB : m));
    addSway(g, 0.018);
  };
  const palm = (x: number, z: number, s: number) => {
    const g = new Group();
    g.position.set(x, 0, z);
    gGarden.add(g);
    const lean = Math.sin(x * 12.9 + z * 4.1) * 0.1;
    for (let i = 0; i < 7; i++) {
      const c = cylinder(g, (0.17 - i * 0.01) * s, 0.95 * s, lean * i * s, (0.47 + i * 0.9) * s, 0, trunk, true, true);
      c.rotation.z = -lean * 0.8;
    }
    const crown = new Group();
    crown.position.set(lean * 6.2 * s, 6.5 * s, 0);
    g.add(crown);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      const arm = new Group();
      arm.rotation.y = a;
      crown.add(arm);
      const inner = box(arm, 1.5 * s, 0.06, 0.55 * s, 0.75 * s, 0.1 * s, 0, frond, true, false);
      inner.rotation.z = 0.28;
      const outer = box(arm, 1.4 * s, 0.05, 0.45 * s, 1.95 * s, -0.25 * s, 0, frond, true, false);
      outer.rotation.z = -0.55;
    }
    ball(crown, 0.34 * s, 0, -0.15 * s, 0, leafB);
    for (let i = 0; i < 3; i++) ball(crown, 0.18 * s, Math.cos(i * 2.1) * 0.35 * s, -0.5 * s, Math.sin(i * 2.1) * 0.35 * s, trunk, false, sphere);
    addSway(g, 0.012);
  };
  palm(-9.6, -7.2, 1.15);
  palm(-7.4, -8.2, 0.95);
  palm(9.8, -6.8, 1.05);
  palm(10.2, 3.5, 0.9);
  roundTree(-9.8, 6.6, 1.05);
  roundTree(9.9, 7.0, 0.85, leafC);
  roundTree(-9.2, -3.6, 0.75, leafC);
  roundTree(5.4, -8.0, 0.9);
  roundTree(-3.6, -8.2, 0.8, leafC);
  const flowerSpots: [number, number, string][] = [];
  for (let i = 0; i < 10; i++) {
    const x = -5.6 + i * 1.0;
    ball(gGarden, 0.42, x, 0.42, 4.7, i % 2 ? leafB : leafA);
    if (x > -0.5 && x < 2) continue;
    flowerSpots.push([x + 0.12, 4.95, ['#ff6fa5', '#ffb020', '#8b5cf6', '#ff6a4d'][i % 4]]);
  }
  flowerSpots.forEach(([x, z, c]) => {
    const fm2 = new MeshStandardMaterial({ color: tone('#f6f8fb'), roughness: 0.6 });
    (tints.landscaping ||= []).push({ m: fm2, base: fm2.color.clone(), to: new Color(c) });
    ball(gGarden, 0.13, x, 0.92, z, fm2, false, sphere);
  });
  box(gGarden, 9.4, 0.55, 0.6, -1.5, 0.28, -7.2, leafB);
  box(gGarden, 0.6, 0.55, 6.4, 10.2, 0.28, -3.4, leafB);
  for (let i = 0; i < 7; i++) ball(gGarden, 0.34, -10.4 + i * 0.52, 0.34, 5.6 + (i % 2) * 0.2, i % 2 ? leafB : leafA);
  const lampPost = std('#d6dde5');
  const lampGlow = std('#fbfcfd');
  reg('landscaping', '#ffd34d', lampGlow);
  for (const [x, z] of [[-5.6, 5.4], [-1.6, 8.0], [3.2, 8.0], [9.0, 8.0]] as const) {
    cylinder(gGarden, 0.05, 1.0, x, 0.5, z, lampPost, false, true);
    ball(gGarden, 0.16, x, 1.1, z, lampGlow, false, sphere);
  }

  /* ---------- sprinklers and water ---------- */
  const heads: Vector3[] = [V(-8.4, 0.2, 6.9), V(-4.0, 0.2, 7.0), V(-9.0, 0.2, -3.0), V(0.4, 0.2, -6.0), V(6.8, 0.2, -5.8), V(9.4, 0.2, 5.4)];
  const headMat = std('#d3dbe4');
  reg('irrigation', undefined, headMat);
  for (const h of heads) cylinder(gGarden, 0.11, 0.32, h.x, 0.15, h.z, headMat, false, true);
  const wetMat = new MeshBasicMaterial({ color: '#8fd0ff', transparent: true, opacity: 0, depthWrite: false });
  for (const h of heads) {
    const w = new Mesh(new RingGeometry(0, 1.9, 40), wetMat);
    w.rotation.x = -Math.PI / 2;
    w.position.set(h.x, 0.04, h.z);
    gGarden.add(w);
  }
  const dc = document.createElement('canvas');
  dc.width = dc.height = 32;
  const dx = dc.getContext('2d')!;
  const dg = dx.createRadialGradient(16, 16, 1, 16, 16, 15);
  dg.addColorStop(0, 'rgba(255,255,255,1)');
  dg.addColorStop(0.5, 'rgba(255,255,255,.8)');
  dg.addColorStop(1, 'rgba(255,255,255,0)');
  dx.fillStyle = dg;
  dx.fillRect(0, 0, 32, 32);
  const dropTex = new CanvasTexture(dc);
  const JET = 4;
  const per = 20;
  const wGeo = new BufferGeometry();
  const wPos = new Float32Array(heads.length * JET * per * 3);
  wGeo.setAttribute('position', new BufferAttribute(wPos, 3));
  const waterMat = new PointsMaterial({ color: '#2aa8ff', map: dropTex, size: 8, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, alphaTest: 0.02 });
  const water = new Points(wGeo, waterMat);
  water.frustumCulled = false;
  gGarden.add(water);

  /* ---------- pin positions ---------- */
  const pinPos: Record<string, Vector3> = {
    roofing: V(-1.5, E + RISE + 0.3, 0.4),
    'aluminium-gutters': V(-6.5, 2 * FH - 0.1, HALF + 0.2),
    'acp-facade': V(-3.6, FH + 2.0, 3.9),
    'aluminium-fabrication': V(1.0, FH + 1.3, 5.2),
    'interior-works': V(1.6, 2.1, 1.2),
    curtains: V(-2.4, 2.4, 3.3),
    'sofa-making': V(-3.6, 1.5, -2.4),
    'furniture-works': V(-5.2, FH + 2.8, 0.9),
    electrical: V(-2.6, 3.0, 0.7),
    plumbing: V(7.6, 2.0, -1.8),
    landscaping: V(-8.4, 3.2, 1.2),
    irrigation: V(-4.0, 1.0, 7.0),
    'painting-texturing': V(-3.6, FH + 2.2, 3.9),
  };

  return {
    root,
    stage,
    gRoof,
    gUpper,
    gUtil,
    fades,
    tints,
    edgeMat,
    cuts,
    cutFront: [cF0, cF1],
    cutRight: [cR0, cR1],
    sways,
    hub,
    core,
    wetMat,
    pulses,
    heads,
    wPos,
    wGeo,
    waterMat,
    water,
    JET,
    per,
    rings,
    pinPos,
    dispose() {
      root.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry && m.geometry !== unitBox) m.geometry.dispose?.();
      });
      for (const mat of solid.values()) mat.dispose();
    },
  };
}

export type World = ReturnType<typeof build>;
