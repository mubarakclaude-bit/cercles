// Procedural isometric home, in the spirit of a premium architectural model:
// warm-white walls, slate roof, lit windows, porch, garage and car on a rounded plot,
// and an interior you can open from above. Each part pops to its own colour when the
// page reaches it. Nothing to download: everything is simple shapes.
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
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { POP } from './director';

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

function roundedRect(w: number, d: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + d - r);
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + d);
  s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
/** A rounded slab lying flat, top face at y = 0 and body hanging below. */
function slabGeo(w: number, d: number, r: number, h: number) {
  const g = new ExtrudeGeometry(roundedRect(w, d, r), { depth: h, bevelEnabled: false, curveSegments: 14 });
  g.rotateX(Math.PI / 2);
  return g;
}

export function build() {
  const root = new Group();
  const unitBox = new BoxGeometry(1, 1, 1);
  const unitEdges = new EdgesGeometry(unitBox);
  const cyl = new CylinderGeometry(0.5, 0.5, 1, 20);
  const cyl6 = new CylinderGeometry(0.5, 0.5, 1, 6);
  const ico = new IcosahedronGeometry(1, 1);
  const sphere = new SphereGeometry(1, 16, 12);

  /* ---------- materials ---------- */
  const solid = new Map<string, MeshStandardMaterial>();
  const std = (color: string, extra: Record<string, unknown> = {}) => {
    const key = color + JSON.stringify(extra);
    let m = solid.get(key);
    if (!m) {
      m = new MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });
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
    elec: [] as Fade[],
    plumb: [] as Fade[],
  };
  const fadeMat = (list: Fade[], color: string, base = 1, extra: Record<string, unknown> = {}) => {
    const m = new MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, transparent: true, ...extra });
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
    const to = new Color(color ?? POP[key] ?? '#396db5');
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
  const gElec = new Group();
  const gPlumb = new Group();
  const gGarden = new Group();
  stage.add(gGround, gHouse, gInside, gUpper, gRoof, gElec, gPlumb, gGarden);

  const FH = 3.3;
  const T = 0.45;

  /* ---------- plot: a rounded slab, lawn, road ---------- */
  const slab = new Mesh(slabGeo(25, 22, 2.6, 1.5), std('#eceef2'));
  slab.position.y = -0.12;
  slab.castShadow = true;
  slab.receiveShadow = true;
  gGround.add(slab);
  const lawnMat = std('#dde8d0');
  reg('lawn', '#b9e6a0', lawnMat);
  const lawn = new Mesh(slabGeo(24.4, 21.4, 2.3, 0.12), lawnMat);
  lawn.receiveShadow = true;
  gGround.add(lawn);
  const road = std('#cdd2da');
  box(gGround, 24.4, 0.05, 1.9, 0, 0.03, 9.55, road, false, true);
  for (let i = 0; i < 9; i++) box(gGround, 1.1, 0.02, 0.1, -10.5 + i * 2.6, 0.07, 9.55, std('#ffffff'), false, false);
  const rings: { mesh: Mesh }[] = [];
  [7, 10, 13].forEach((r) => {
    const m = new Mesh(new RingGeometry(r - 0.1, r + 0.1, 160), new MeshBasicMaterial({ color: '#396db5', transparent: true, opacity: 0.08, side: DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.05;
    gGround.add(m);
    rings.push({ mesh: m });
  });
  const pageShadow = new Mesh(new PlaneGeometry(36, 33), new ShadowMaterial({ opacity: 0.07 }));
  pageShadow.rotation.x = -Math.PI / 2;
  pageShadow.position.y = -2.7;
  pageShadow.receiveShadow = true;
  root.add(pageShadow);

  /* ---------- walls: thick, with edges; front and right ones can drop for a cutaway ---------- */
  const wallMain = fadeMat(fades.walls, '#f3f0ea');
  const wallWing = fadeMat(fades.walls, '#f3f0ea');
  reg('walls', '#ffd9b3', wallMain);
  reg('wing', '#b5ebe1', wallWing);
  const edgeMat = new LineBasicMaterial({ color: '#8a93a6', transparent: true, opacity: 0.18 });
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
  const cF0 = cutGroup(gHouse, 0);
  const cR0 = cutGroup(gHouse, 0);
  withEdges(box(cF0, 9, FH, T, -1.5, FH / 2, 3.6 - T / 2, wallMain));
  withEdges(box(cR0, T, FH, 7.2, 3 - T / 2, FH / 2, 0, wallMain));
  withEdges(box(gHouse, 9, FH, T, -1.5, FH / 2, -3.6 + T / 2, wallMain));
  withEdges(box(gHouse, T, FH, 7.2, -6 + T / 2, FH / 2, 0, wallMain));
  withEdges(box(cF0, 5.2, FH, T, 5.6, FH / 2, 2.4 - T / 2, wallWing));
  withEdges(box(cR0, T, FH, 6, 8.2 - T / 2, FH / 2, -0.6, wallWing));
  withEdges(box(gHouse, 5.2, FH, T, 5.6, FH / 2, -3.6 + T / 2, wallWing));
  const cF1 = cutGroup(gUpper, FH);
  const cR1 = cutGroup(gUpper, FH);
  withEdges(box(cF1, 9, FH, T, -1.5, FH / 2, 3.6 - T / 2, wallMain));
  withEdges(box(cR1, T, FH, 7.2, 3 - T / 2, FH / 2, 0, wallMain));
  withEdges(box(gUpper, 9, FH, T, -1.5, FH * 1.5, -3.6 + T / 2, wallMain));
  withEdges(box(gUpper, T, FH, 7.2, -6 + T / 2, FH * 1.5, 0, wallMain));

  // Stone plinth, floors, ceiling deck
  const plinth = std('#d9d5cd');
  for (const [w, d, x, z] of [[9.2, 0.2, -1.5, 3.72], [9.2, 0.2, -1.5, -3.72], [0.2, 7.4, -6.12, 0], [0.2, 7.4, 3.12, 0]] as const) box(gHouse, w, 0.45, d, x, 0.22, z, plinth, false, true);
  const floorMat = std('#e9e2d6');
  reg('interior-works', undefined, floorMat);
  box(gHouse, 9, 0.2, 7.2, -1.5, 0.1, 0, floorMat, false, true);
  box(gHouse, 5.2, 0.2, 6, 5.6, 0.1, -0.6, std('#dfe2e7'), false, true);
  const slab2 = std('#e4dfd5');
  withEdges(box(gUpper, 9.2, 0.3, 7.4, -1.5, FH, 0, slab2, true, true));
  const deck = fadeMat(fades.roof, '#ece8e0');
  withEdges(box(gRoof, 9.4, 0.3, 7.6, -1.5, 2 * FH + 0.02, 0, deck, true, true));

  // Wing: flat terrace roof with parapet, water tank
  withEdges(box(gHouse, 5.6, 0.3, 6.4, 5.6, FH + 0.12, -0.6, std('#eeebe5')));
  const membrane = std('#e6e3dc');
  reg('roofing', undefined, membrane);
  box(gHouse, 5.0, 0.06, 5.8, 5.6, FH + 0.3, -0.6, membrane, false, true);
  const parapet = std('#e8e4dc');
  reg('wing', '#ff9a7a', parapet);
  withEdges(box(gHouse, 5.6, 0.6, 0.24, 5.6, FH + 0.6, 2.5, parapet));
  withEdges(box(gHouse, 5.6, 0.6, 0.24, 5.6, FH + 0.6, -3.7, parapet));
  withEdges(box(gHouse, 0.24, 0.6, 6.4, 8.3, FH + 0.6, -0.6, parapet));
  const tankMat = fadeMat(fades.walls, '#dfe6ee');
  reg('plumbing', undefined, tankMat);
  cylinder(gHouse, 0.8, 1.3, 6.6, FH + 1.0, -1.8, tankMat);
  cylinder(gHouse, 0.85, 0.12, 6.6, FH + 1.7, -1.8, std('#cfd6de'));

  /* ---------- roof: slate, main gable + cross gable + chimney (all lift away together) ---------- */
  const tc = document.createElement('canvas');
  tc.width = 64;
  tc.height = 128;
  const tx = tc.getContext('2d')!;
  tx.fillStyle = '#ffffff';
  tx.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 8; i++) {
    tx.fillStyle = i % 2 ? 'rgba(0,0,0,.05)' : 'rgba(0,0,0,.16)';
    tx.fillRect(0, i * 16, 64, 6);
  }
  tx.fillStyle = 'rgba(0,0,0,.12)';
  for (let i = 0; i < 4; i++) tx.fillRect(i * 16, 0, 2, 128);
  const tileTex = new CanvasTexture(tc);
  tileTex.colorSpace = SRGBColorSpace;
  tileTex.wrapS = tileTex.wrapT = RepeatWrapping;
  tileTex.repeat.set(6, 2.6);
  const roofMat = fadeMat(fades.roof, '#6f829f', 1, { map: tileTex });
  reg('roofing', undefined, roofMat);
  const E = 2 * FH + 0.18;
  const RISE = 2.7;
  const HALF = 4.25;
  const L = Math.hypot(HALF, RISE);
  const th = Math.atan2(RISE, HALF);
  box(gRoof, 10.4, 0.28, L, -1.5, E + RISE / 2, HALF / 2, roofMat).rotation.x = th;
  box(gRoof, 10.4, 0.28, L, -1.5, E + RISE / 2, -HALF / 2, roofMat).rotation.x = -th;
  const ridgeMat = fadeMat(fades.roof, '#5a6b86');
  reg('roofing', undefined, ridgeMat);
  box(gRoof, 10.6, 0.22, 0.42, -1.5, E + RISE + 0.12, 0, ridgeMat);

  // cross gable over the facade
  const cx = -3.2;
  const CH = 2.4;
  const CR = 1.9;
  const cl = Math.hypot(CH, CR);
  const ca = Math.atan2(CR, CH);
  const crossL = box(gRoof, cl, 0.26, 5.6, cx - CH / 2, E + CR / 2 + 0.05, 1.5, roofMat);
  crossL.rotation.z = ca;
  const crossR = box(gRoof, cl, 0.26, 5.6, cx + CH / 2, E + CR / 2 + 0.05, 1.5, roofMat);
  crossR.rotation.z = -ca;
  box(gRoof, 0.2, 0.2, 5.7, cx, E + CR + 0.12, 1.5, ridgeMat);
  const crossShape = new Shape();
  crossShape.moveTo(-CH, E);
  crossShape.lineTo(CH, E);
  crossShape.lineTo(0, E + CR);
  crossShape.closePath();
  const crossGeo = new ExtrudeGeometry(crossShape, { depth: 0.35, bevelEnabled: false });
  const gableMat = fadeMat(fades.roof, '#f3f0ea');
  reg('walls', '#ffd9b3', gableMat);
  const crossFace = new Mesh(crossGeo, gableMat);
  crossFace.position.set(cx, 0, 3.75);
  crossFace.castShadow = true;
  gRoof.add(crossFace);
  const trim = fadeMat(fades.roof, '#ffffff');
  const atticGlass = fadeMat(fades.glass, '#fff1c9', 0.8, { emissive: new Color('#ffd27a'), emissiveIntensity: 0.5, roughness: 0.2 });
  box(gRoof, 1.0, 1.0, 0.12, cx, E + 0.75, 4.12, trim, false, false);
  box(gRoof, 0.8, 0.8, 0.06, cx, E + 0.75, 4.2, atticGlass, false, false);
  box(gRoof, 0.06, 0.8, 0.07, cx, E + 0.75, 4.22, trim, false, false);

  // gable ends of the main roof
  const gableShape = new Shape();
  gableShape.moveTo(-HALF + 0.2, E);
  gableShape.lineTo(HALF - 0.2, E);
  gableShape.lineTo(0, E + RISE);
  gableShape.closePath();
  const gableGeo = new ExtrudeGeometry(gableShape, { depth: T, bevelEnabled: false });
  gableGeo.rotateY(Math.PI / 2);
  for (const x of [-6, 3 - T]) {
    const g = new Mesh(gableGeo, gableMat);
    g.position.set(x, 0, 0);
    g.castShadow = true;
    g.receiveShadow = true;
    gRoof.add(g);
  }
  box(gRoof, 0.9, 2.7, 0.9, 1.3, E + 1.9, -1.1, fadeMat(fades.roof, '#e3ddd2'));

  /* ---------- facade: ACP cladding, windows with grids, porch, balcony, garage ---------- */
  const claddingA = fadeMat(fades.skin, '#e9e4da');
  const claddingB = fadeMat(fades.skin, '#dcd6ca');
  reg('acp-facade', undefined, claddingA, claddingB);
  for (let i = 0; i < 11; i++) box(gUpper, 0.36, 2.9, 0.12, -5.75 + i * 0.4, FH + 1.75, 3.6 + 0.06, i % 2 ? claddingB : claddingA);

  const frameMat = fadeMat(fades.skin, '#fbfaf7');
  reg('aluminium-fabrication', undefined, frameMat);
  const glassMat = fadeMat(fades.glass, '#fff0c4', 0.85, { emissive: new Color('#ffd27a'), emissiveIntensity: 0.42, roughness: 0.2 });
  const sillMat = std('#f7f5f0');
  const curtainMats: MeshStandardMaterial[] = [];

  const win = (host: Group, curtHost: Group, x: number, y: number, w: number, h: number, face: number, withCurtain: boolean, axis: 'z' | 'x' = 'z') => {
    const g = new Group();
    box(g, w, h, 0.18, 0, 0, 0, frameMat, true, false);
    box(g, w - 0.26, h - 0.26, 0.05, 0, 0, 0.11, glassMat, false, false);
    const cols = Math.max(1, Math.round(w / 1.1));
    for (let i = 1; i < cols; i++) box(g, 0.07, h - 0.1, 0.07, -w / 2 + (w / cols) * i, 0, 0.13, frameMat, false, false);
    box(g, w - 0.1, 0.07, 0.07, 0, 0.1, 0.13, frameMat, false, false);
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
          const mat = fadeMat(fades.curt, i % 2 ? '#f6f1ea' : '#e6dfd4');
          curtainMats.push(mat);
          box(c, fw * 1.05, h - 0.1, 0.12, side * (w / 2 - 0.22 - i * fw), 0, (i % 2 ? 0.06 : -0.06) - 0.45, mat, false, false);
        }
      }
      const rod = fadeMat(fades.curt, '#cfc8bb');
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
  win(gUpper, gUpper, 0.2, FH + 1.95, 2.2, 1.8, 3.0, true, 'x');
  if (curtainMats.length) reg('curtains', undefined, ...curtainMats);

  // Front door, porch platform and columns (the balcony above is the porch roof)
  const doorMat = fadeMat(fades.skin, '#c9a67a');
  reg('aluminium-fabrication', undefined, doorMat);
  box(gHouse, 1.2, 2.5, 0.16, 0.8, 1.35, 3.6 + 0.04, doorMat, true, false);
  box(gHouse, 0.08, 0.45, 0.07, 1.25, 1.3, 3.74, sillMat, false, false);
  withEdges(box(gHouse, 3.2, 0.2, 2.0, 0.8, 0.1, 4.6, std('#e4dfd6'), false, true));
  withEdges(box(gHouse, 3.2, 0.12, 0.5, 0.8, 0.06, 5.85, std('#e4dfd6'), false, true));
  for (const x of [-0.6, 2.2]) cylinder(gHouse, 0.14, FH - 0.1, x, FH / 2 + 0.1, 5.4, sillMat);

  // Balcony with glass and aluminium railing
  withEdges(box(gUpper, 3.2, 0.26, 2.0, 0.8, FH + 0.04, 4.6, sillMat));
  const rail = fadeMat(fades.skin, '#e7eaee');
  reg('aluminium-fabrication', undefined, rail);
  const railGlass = fadeMat(fades.glass, '#eaf4fb', 0.4, { roughness: 0.1 });
  box(gUpper, 3.2, 0.9, 0.05, 0.8, FH + 0.7, 5.6, railGlass, false, false);
  box(gUpper, 0.05, 0.9, 2.0, -0.8, FH + 0.7, 4.6, railGlass, false, false);
  box(gUpper, 0.05, 0.9, 2.0, 2.4, FH + 0.7, 4.6, railGlass, false, false);
  box(gUpper, 3.25, 0.07, 0.09, 0.8, FH + 1.18, 5.6, rail, false, false);
  box(gUpper, 0.09, 0.07, 2.05, -0.8, FH + 1.18, 4.6, rail, false, false);
  box(gUpper, 0.09, 0.07, 2.05, 2.4, FH + 1.18, 4.6, rail, false, false);
  for (const [x, z] of [[-0.8, 5.6], [2.4, 5.6], [-0.8, 3.7], [2.4, 3.7]] as const) box(gUpper, 0.07, 1.0, 0.07, x, FH + 0.7, z, rail, false, false);

  // Garage door on the wing
  box(gHouse, 4.0, 2.7, 0.16, 5.6, 1.45, 2.4 + 0.04, frameMat, true, false);
  for (let i = 0; i < 6; i++) box(gHouse, 3.6, 0.32, 0.08, 5.6, 0.45 + i * 0.4, 2.54, std('#eceae4'), false, false);

  // Rainwater gutters (ride up with the roof) and downpipes
  const gutter = fadeMat(fades.skin, '#e3e6ea');
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
  const accent = fadeMat(fades.furn, '#eeeae2');
  reg('painting-texturing', undefined, accent);
  box(gInside, 7.6, 2.95, 0.07, -1.5, 1.6, -3.1, accent, false, false);
  const rug = new Mesh(cyl, fm('interior-works', '#f4efe6'));
  rug.scale.set(4.0, 0.05, 4.0);
  rug.position.set(-2.6, 0.24, 0.6);
  rug.receiveShadow = true;
  gInside.add(rug);
  const sofa = fm('sofa-making', '#ddd8cf');
  const cush = fm('sofa-making', '#f2eee6');
  box(gInside, 3.4, 0.5, 1.05, -3.6, 0.5, -2.45, sofa);
  box(gInside, 3.4, 0.9, 0.3, -3.6, 1.05, -2.95, sofa);
  box(gInside, 0.34, 0.75, 1.05, -5.2, 0.75, -2.45, sofa);
  box(gInside, 0.34, 0.75, 1.05, -2.0, 0.75, -2.45, sofa);
  box(gInside, 1.05, 0.5, 1.9, -5.0, 0.5, -0.95, sofa);
  box(gInside, 0.65, 0.5, 0.2, -4.4, 0.98, -2.7, cush);
  box(gInside, 0.65, 0.5, 0.2, -2.8, 0.98, -2.7, cush);
  const wood = fm('furniture-works', '#d8cfc0');
  const woodD = fm('furniture-works', '#c7bcaa');
  const lightF = fm('furniture-works', '#f1ede5');
  box(gInside, 1.5, 0.1, 0.9, -2.6, 0.64, 0.7, woodD);
  for (const [x, z] of [[-3.25, 0.35], [-1.95, 0.35], [-3.25, 1.05], [-1.95, 1.05]] as const) box(gInside, 0.09, 0.42, 0.09, x, 0.42, z, woodD, false);
  box(gInside, 1.0, 0.5, 1.0, -0.2, 0.45, 0.8, cush);
  box(gInside, 1.0, 0.7, 0.22, 0.1, 0.95, 0.8, cush);
  box(gInside, 2.0, 0.1, 1.2, 0.9, 0.88, -1.7, wood);
  for (const [x, z] of [[0.0, -2.25], [1.8, -2.25], [0.0, -1.15], [1.8, -1.15]] as const) box(gInside, 0.09, 0.78, 0.09, x, 0.55, z, woodD, false);
  for (const [x, z] of [[0.45, -2.5], [1.35, -2.5], [0.45, -0.9], [1.35, -0.9]] as const) box(gInside, 0.5, 0.45, 0.5, x, 0.48, z, lightF);
  box(gInside, 0.75, 0.98, 2.0, 2.1, 0.58, -1.8, woodD); // kitchen counter
  box(gInside, 0.75, 0.5, 2.0, 2.1, 2.4, -1.8, wood);
  box(gInside, 0.8, 1.9, 0.8, 2.1, 1.1, -3.0, lightF); // fridge
  // TV unit and TV on the left wall, plants, floor lamp, wall art
  box(gInside, 0.45, 0.5, 2.4, -5.45, 0.45, 1.6, wood);
  box(gInside, 0.06, 1.0, 1.9, -5.55, 1.5, 1.6, fadeMat(fades.furn, '#2a2f3d'));
  ball(gInside, 0.35, -5.2, 0.95, 2.9, fm('landscaping', '#cfdcc0'));
  cylinder(gInside, 0.3, 0.6, -5.2, 0.3, 2.9, lightF);
  ball(gInside, 0.3, 2.2, 0.75, 2.9, fm('landscaping', '#cfdcc0'));
  cylinder(gInside, 0.25, 0.5, 2.2, 0.25, 2.9, lightF);
  const lampMat = fadeMat(fades.furn, '#fff6dc', 1, { emissive: new Color('#ffe2a0'), emissiveIntensity: 0.6 });
  reg('interior-works', undefined, lampMat);
  cylinder(gInside, 0.03, 1.5, -1.0, 0.8, 1.9, lightF, false, true);
  cylinder(gInside, 0.28, 0.35, -1.0, 1.7, 1.9, lampMat, false);
  for (const x of [-4.2, -2.4, -0.6]) box(gInside, 0.9, 0.7, 0.05, x, 2.0, -3.05, fm('painting-texturing', '#ece7de'));
  const cord = fm('interior-works', '#cdc6b9');
  const pendants: Vector3[] = [];
  for (const [x, z] of [[-2.6, 0.6], [0.9, -1.7]] as const) {
    cylinder(gUpper, 0.03, 0.9, x, FH - 0.55, z, cord, false, true);
    cylinder(gUpper, 0.34, 0.24, x, FH - 1.1, z, lampMat, false);
    pendants.push(V(x, FH - 1.1, z));
  }
  const stair = fm('interior-works', '#d9d3c7');
  for (let i = 0; i < 9; i++) box(gInside, 1.0, 0.2, 0.38, 1.6, 0.2 + i * 0.33, 2.7 - i * 0.37, stair);
  // a small figure on the stairs
  const skinM = std('#e4c9ae');
  const clothM = std('#2b3040');
  cylinder(gInside, 0.14, 0.55, 1.6, 1.95, 1.5, clothM, true, true);
  ball(gInside, 0.15, 1.6, 2.4, 1.5, skinM, true, sphere);

  // Upper floor: bedroom, wardrobe, bath
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
  box(gUpper, 1.3, 0.05, 0.6, -2.4, U + 0.75, 2.6, wood); // desk by the window
  box(gUpper, 0.5, 0.45, 0.5, -2.4, U + 0.3, 3.2, lightF);
  const glassPart = fadeMat(fades.glass, '#eaf4fb', 0.35, { roughness: 0.1 });
  box(gUpper, 0.05, 2.2, 2.6, 0.1, U + 1.1, -1.7, glassPart, false, false);

  /* ---------- electrical: wires, switches, lit bulbs, smart hub (amber and red) ---------- */
  const up = new Vector3(0, 1, 0);
  const tmpDir = new Vector3();
  const tmpMid = new Vector3();
  const tube = (group: Group, pts: Vector3[], r: number, mat: Material): PulsePath => {
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
      group.add(m);
      ball(group, r * 1.5, pts[i].x, pts[i].y, pts[i].z, mat, false, sphere);
    }
    return { pts, len, total: len[len.length - 1] };
  };
  const amber = fadeBasic(fades.elec, '#ffb020');
  const red = fadeBasic(fades.elec, '#ff4d4f');
  const inkE = fadeBasic(fades.elec, '#14154a');
  const bulbM = fadeBasic(fades.elec, '#fff3b0');
  const wires: PulsePath[] = [
    tube(gElec, [V(-5.4, 1.3, 1.6), V(-5.4, 3.0, 1.6), V(-2.6, 3.0, 1.6), V(-2.6, 3.0, 0.6), V(-2.6, 2.1, 0.6)], 0.07, amber),
    tube(gElec, [V(-2.6, 3.0, 1.6), V(0.9, 3.0, 1.6), V(0.9, 3.0, -1.7), V(0.9, 2.0, -1.7)], 0.07, red),
    tube(gElec, [V(-5.4, 3.0, 1.6), V(-5.4, 6.3, 1.6), V(-1.0, 6.3, 1.6), V(-1.0, 6.3, -0.5), V(-1.0, 5.3, -0.5)], 0.07, amber),
    tube(gElec, [V(-5.4, 0.35, -2.7), V(2.3, 0.35, -2.7), V(2.3, 0.35, 2.0), V(-1.0, 0.35, 2.0)], 0.06, red),
    tube(gElec, [V(-5.4, 1.3, 1.6), V(-5.4, 1.3, 3.0), V(-4.2, 1.3, 3.0)], 0.06, amber),
  ];
  box(gElec, 0.34, 0.7, 0.44, -5.4, 1.2, 1.6, inkE, false);
  for (const [x, y, z] of [[-4.2, 1.3, 3.2], [-0.6, 1.3, 3.2], [2.2, 1.0, -1.5], [-4.9, FH + 1.3, 3.2]] as const) box(gElec, 0.2, 0.3, 0.08, x, y, z, bulbM, false, false);
  const bulbs: Vector3[] = [V(-2.6, 2.1, 0.6), V(0.9, 2.0, -1.7), V(-1.0, 5.3, -0.5), V(-3.6, FH + 2.0, 1.0), V(1.0, 2.4, -3.0)];
  for (const b of bulbs) ball(gElec, 0.2, b.x, b.y, b.z, bulbM, false, sphere);
  const hubMat = new MeshStandardMaterial({ color: '#396db5', transparent: true, opacity: 0.5, emissive: new Color('#396db5'), emissiveIntensity: 0.7, roughness: 0.2 });
  fades.elec.push({ m: hubMat, base: 0.5 });
  const hub = new Mesh(unitBox, hubMat);
  hub.scale.setScalar(1.1);
  hub.position.set(-2.6, 1.2, 0.6);
  gElec.add(hub);
  const coreMat = new MeshStandardMaterial({ color: '#ffffff', transparent: true, emissive: new Color('#ffffff'), emissiveIntensity: 0.9 });
  fades.elec.push({ m: coreMat, base: 1 });
  const core = new Mesh(sphere, coreMat);
  core.scale.setScalar(0.28);
  core.position.copy(hub.position);
  gElec.add(core);
  // warm halos around the lights
  const hc = document.createElement('canvas');
  hc.width = hc.height = 64;
  const hx = hc.getContext('2d')!;
  const hg = hx.createRadialGradient(32, 32, 2, 32, 32, 32);
  hg.addColorStop(0, 'rgba(255,214,120,.95)');
  hg.addColorStop(0.45, 'rgba(255,200,90,.35)');
  hg.addColorStop(1, 'rgba(255,200,90,0)');
  hx.fillStyle = hg;
  hx.fillRect(0, 0, 64, 64);
  const haloTex = new CanvasTexture(hc);
  const halos: Sprite[] = [];
  const haloMat = new SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0 });
  for (const b of [...bulbs, ...pendants]) {
    const sp = new Sprite(haloMat);
    sp.scale.setScalar(2.6);
    sp.position.copy(b);
    gElec.add(sp);
    halos.push(sp);
  }

  /* ---------- plumbing: supply and drain pipes, taps, tank, bath (blue and teal) ---------- */
  const supply = fadeBasic(fades.plumb, '#1e90ff');
  const drain = fadeBasic(fades.plumb, '#12b5a8');
  const fixM = new MeshStandardMaterial({ color: '#f4f6f8', roughness: 0.4, transparent: true });
  fades.plumb.push({ m: fixM, base: 1 });
  const tap = fadeBasic(fades.plumb, '#1e90ff');
  const pipes: PulsePath[] = [
    tube(gPlumb, [V(6.6, 5.0, -1.8), V(6.6, 3.7, -1.8), V(7.6, 3.7, -1.8), V(7.6, 0.5, -1.8), V(2.4, 0.5, -1.8), V(2.4, 3.8, -1.8), V(2.4, FH + 1.2, -2.2)], 0.1, supply),
    tube(gPlumb, [V(7.6, 0.5, -1.8), V(7.6, 0.2, 2.0), V(7.6, 0.2, 7.0), V(-2.0, 0.2, 7.0), V(-6.2, 0.2, 5.9)], 0.1, supply),
    tube(gPlumb, [V(2.4, 0.5, -1.8), V(2.4, 1.2, -2.6)], 0.1, supply),
    tube(gPlumb, [V(1.4, FH + 0.5, -2.2), V(1.4, 0.1, -2.2), V(1.4, 0.1, 1.0), V(-3.0, 0.1, 1.0), V(-3.0, 0.1, 6.5)], 0.12, drain),
  ];
  box(gPlumb, 0.9, 0.55, 0.65, 2.4, 0.9, -2.7, fixM, false); // sink
  cylinder(gPlumb, 0.05, 0.4, 2.4, 1.35, -2.95, tap, false, true);
  box(gPlumb, 1.7, 0.55, 0.85, 1.5, U + 0.3, -2.7, fixM, false); // bath
  box(gPlumb, 0.5, 0.5, 0.7, 2.2, U + 0.28, -1.4, fixM, false); // toilet
  cylinder(gPlumb, 0.05, 1.6, 0.6, U + 1.2, -3.0, tap, false, true); // shower
  ball(gPlumb, 0.22, 0.6, U + 2.0, -3.0, tap, false, sphere);
  const pulses: { path: PulsePath; mesh: Mesh; k: number; speed: number }[] = [];
  const addPulses = (group: Group, paths: PulsePath[], mat: Material, speed: number, r: number) => {
    for (const p of paths) {
      const n = Math.max(2, Math.round(p.total / 3));
      for (let k = 0; k < n; k++) {
        const m = new Mesh(sphere, mat);
        m.scale.setScalar(r);
        group.add(m);
        pulses.push({ path: p, mesh: m, k: k / n, speed });
      }
    }
  };
  addPulses(gElec, wires, inkE, 0.16, 0.14);
  addPulses(gPlumb, pipes, fadeBasic(fades.plumb, '#ffffff'), 0.1, 0.17);

  /* ---------- garden ---------- */
  const stone = std('#e7e3da');
  for (let i = 0; i < 3; i++) box(gGarden, 1.3, 0.1, 0.8, 0.8, 0.05, 6.1 + i * 0.95, stone, false);
  box(gGarden, 4.4, 0.08, 6.6, 5.8, 0.04, 5.7, std('#dcdfe3'), false);
  for (let i = 1; i < 5; i++) box(gGarden, 4.4, 0.09, 0.04, 5.8, 0.05, 2.4 + i * 1.3, std('#c9ced4'), false, false);
  const cw = std('#f3f0ea');
  const cap = std('#dcd7cd');
  for (const [x0, x1] of [[-11.9, -0.2], [2.0, 3.6], [8.0, 11.9]] as const) {
    withEdges(box(gGarden, x1 - x0, 1.0, 0.26, (x0 + x1) / 2, 0.5, 8.3, cw));
    box(gGarden, x1 - x0 + 0.1, 0.1, 0.36, (x0 + x1) / 2, 1.05, 8.3, cap, false);
  }
  const patio = std('#ece6da');
  const post = std('#e2dccf');
  const chair = std('#f4f1ea');
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

  // a car on the drive and an EV charger
  const carBody = std('#f4f5f7', { roughness: 0.4 });
  const carGlass = std('#3a4152', { roughness: 0.2 });
  const tyre = std('#2a2e38');
  const car = new Group();
  car.position.set(5.9, 0, 6.4);
  car.rotation.y = 0.05;
  gGarden.add(car);
  box(car, 1.25, 0.5, 2.7, 0, 0.55, 0, carBody);
  box(car, 1.1, 0.42, 1.4, 0, 1.0, -0.1, carGlass);
  box(car, 1.0, 0.06, 1.2, 0, 1.24, -0.1, carBody);
  for (const [x, z] of [[-0.62, 0.8], [0.62, 0.8], [-0.62, -0.8], [0.62, -0.8]] as const) {
    const w = cylinder(car, 0.26, 0.2, x, 0.28, z, tyre, true, false);
    w.rotation.z = Math.PI / 2;
  }
  cylinder(gGarden, 0.09, 1.3, 3.9, 0.65, 4.6, std('#e8eaee'), true, true);
  box(gGarden, 0.3, 0.45, 0.2, 3.9, 1.4, 4.6, std('#f9fafb'));
  box(gGarden, 0.14, 0.1, 0.04, 3.9, 1.45, 4.72, std('#b9d174', { emissive: new Color('#b9d174'), emissiveIntensity: 0.5 }), false, false);

  // trees: soft greens, swaying
  const leafA = std('#92b872', { flatShading: true });
  const leafB = std('#7ea25f', { flatShading: true });
  const leafC = std('#a9c88a', { flatShading: true });
  const trunk = std('#ad8f6d');
  const frond = std('#6f9a4f', { flatShading: true, side: DoubleSide });
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
      const arm = new Group();
      arm.rotation.y = (i / 11) * Math.PI * 2;
      crown.add(arm);
      const inner = box(arm, 1.5 * s, 0.06, 0.55 * s, 0.75 * s, 0.1 * s, 0, frond, false, false);
      inner.rotation.z = 0.28;
      const outer = box(arm, 1.4 * s, 0.05, 0.45 * s, 1.95 * s, -0.25 * s, 0, frond, false, false);
      outer.rotation.z = -0.55;
    }
    ball(crown, 0.34 * s, 0, -0.15 * s, 0, leafB);
    for (let i = 0; i < 3; i++) ball(crown, 0.18 * s, Math.cos(i * 2.1) * 0.35 * s, -0.5 * s, Math.sin(i * 2.1) * 0.35 * s, trunk, false, sphere);
    addSway(g, 0.012);
  };
  palm(-10.2, -7.6, 1.15);
  palm(-8.0, -8.6, 0.95);
  palm(10.4, -7.2, 1.05);
  palm(11, 3.5, 0.9);
  roundTree(-10.6, 6.4, 1.05);
  roundTree(10.6, 6.6, 0.85, leafC);
  roundTree(-10.0, -3.8, 0.75, leafC);
  roundTree(5.6, -8.4, 0.9);
  roundTree(-4.0, -8.6, 0.8, leafC);
  const flowerSpots: [number, number, string][] = [];
  for (let i = 0; i < 10; i++) {
    const x = -5.6 + i * 1.0;
    ball(gGarden, 0.42, x, 0.42, 4.9, i % 2 ? leafB : leafA);
    if (x > -1 && x < 2.6) continue;
    flowerSpots.push([x + 0.12, 5.15, ['#ff6fa5', '#ffb020', '#8b5cf6', '#ff6a4d'][i % 4]]);
  }
  flowerSpots.forEach(([x, z, c]) => {
    const fm2 = new MeshStandardMaterial({ color: '#f6f4ee', roughness: 0.6 });
    (tints.landscaping ||= []).push({ m: fm2, base: fm2.color.clone(), to: new Color(c) });
    ball(gGarden, 0.13, x, 0.92, z, fm2, false, sphere);
  });
  box(gGarden, 10, 0.55, 0.6, -1.5, 0.28, -7.6, leafB);
  box(gGarden, 0.6, 0.55, 6.4, 11.2, 0.28, -3.6, leafB);
  for (let i = 0; i < 7; i++) ball(gGarden, 0.34, -11.4 + i * 0.52, 0.34, 5.6 + (i % 2) * 0.2, i % 2 ? leafB : leafA);
  const lampPost = std('#d9dce2');
  const lampGlow = std('#fff4cf', { emissive: new Color('#ffd988'), emissiveIntensity: 0.5 });
  reg('landscaping', '#ffd34d', lampGlow);
  for (const [x, z] of [[-5.6, 5.6], [-1.6, 7.6], [3.2, 7.6], [9.0, 7.6]] as const) {
    cylinder(gGarden, 0.05, 1.0, x, 0.5, z, lampPost, false, true);
    ball(gGarden, 0.16, x, 1.1, z, lampGlow, false, sphere);
  }

  /* ---------- sprinklers and water ---------- */
  const heads: Vector3[] = [V(-8.4, 0.2, 6.5), V(-4.0, 0.2, 6.6), V(-9.6, 0.2, -3.0), V(0.4, 0.2, -6.0), V(7.2, 0.2, -5.6), V(10.2, 0.2, 5.2)];
  const headMat = std('#d5dae1');
  reg('irrigation', undefined, headMat);
  for (const h of heads) cylinder(gGarden, 0.11, 0.32, h.x, 0.15, h.z, headMat, false, true);
  const wetMat = new MeshBasicMaterial({ color: '#8fd0ff', transparent: true, opacity: 0, depthWrite: false });
  for (const h of heads) {
    const w = new Mesh(new RingGeometry(0, 1.9, 40), wetMat);
    w.rotation.x = -Math.PI / 2;
    w.position.set(h.x, 0.06, h.z);
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
    'aluminium-fabrication': V(0.8, FH + 1.3, 5.7),
    'interior-works': V(1.6, 2.1, 1.2),
    curtains: V(-2.4, 2.4, 3.3),
    'sofa-making': V(-3.6, 1.5, -2.4),
    'furniture-works': V(-5.2, FH + 2.8, 0.9),
    electrical: V(-2.6, 3.0, 0.7),
    plumbing: V(6.6, FH + 1.6, -1.8),
    landscaping: V(-8.4, 3.2, 1.2),
    irrigation: V(-4.0, 1.0, 6.6),
    'painting-texturing': V(-3.6, FH + 2.2, 3.9),
  };

  return {
    root,
    stage,
    gRoof,
    gUpper,
    gElec,
    gPlumb,
    fades,
    tints,
    edgeMat,
    cuts,
    sways,
    hub,
    core,
    halos,
    haloMat,
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
