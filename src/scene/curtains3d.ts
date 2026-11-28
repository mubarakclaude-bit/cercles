// The curtain lab: a small 3D room with one window, where each curtain style and blind type
// can be opened and closed. Everything is built from code (no model files), so it loads fast.
// Units are metres. The wall is at z = 0, the camera looks at it from the room (+z).
import {
  NeutralToneMapping,
  PCFSoftShadowMap,
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  BufferAttribute,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three';

export type LabType =
  | 'pleated'
  | 'ripple'
  | 'eyelet'
  | 'roman'
  | 'roller'
  | 'zebra'
  | 'vertical'
  | 'venetian'
  | 'blackout'
  | 'layers'
  | 'motorised';

// The window opening
const WX = 0.8; // half width
const SILL = 0.8;
const HEAD = 2.6;
const CEIL = 3.05;
const TRACK = 1.28; // half width of a curtain track

/* ---------- small helpers ---------- */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true): Texture {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new CanvasTexture(cv);
  if (srgb) t.colorSpace = SRGBColorSpace;
  return t;
}

// fine fabric grain, multiplied over the colour
const weave = () => {
  const t = canvasTex(64, 64, (c) => {
    c.fillStyle = '#f2f2f2';
    c.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 64; i += 2) {
      c.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.3})`;
      c.fillRect(0, i, 64, 1);
      c.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.04})`;
      c.fillRect(i, 0, 1, 64);
    }
  });
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(26, 26);
  return t;
};

/* ---------- a curtain panel whose folds follow how open it is ---------- */
type Head = 'pleat' | 'wave' | 'eyelet';
interface Panel {
  mesh: Mesh;
  update: (w: number) => void;
  side: number;
}

function makePanel(mat: Material, side: number, head: Head, top: number, z: number, folds = 9): Panel {
  const segX = folds * 14;
  const segY = 18;
  const geo = new PlaneGeometry(1, 1, segX, segY);
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) + 0.5;
    uv[i * 2 + 1] = pos.getY(i) + 0.5;
  }
  const shade = new Float32Array(pos.count * 3);
  geo.setAttribute('color', new BufferAttribute(shade, 3));
  const bottom = 0.03;
  const fabric = TRACK * 1.7; // fabric per panel: about 1.7x fullness
  mat.vertexColors = true; // panels carry their own fold shading
  const mesh = new Mesh(geo, mat);
  const update = (w: number) => {
    const p = w / folds;
    const q = fabric / folds;
    const A = Math.sqrt(Math.max(0, q * q - p * p)) / 5.4;
    for (let i = 0; i < pos.count; i++) {
      const u = uv[i * 2];
      const v = uv[i * 2 + 1];
      const y = lerp(bottom, top, v);
      const ph = u * folds * Math.PI * 2;
      const s = Math.sin(ph);
      let shape = Math.sign(s) * Math.pow(Math.abs(s), 0.85);
      if (head === 'pleat') {
        // tailored pinch pleats at the top, relaxing into soft folds below
        const b = smooth(top - 0.32, top - 0.06, y);
        shape = lerp(s, Math.sign(s) * Math.pow(Math.abs(s), 0.3), b);
      }
      const natural = 1 + 0.07 * Math.sin(u * folds * 1.7 + v * 3.1) + 0.06 * (1 - v);
      const x = -side * TRACK + side * u * w;
      pos.setXYZ(i, x, y, z + A * natural * shape);
      // the inside of each fold gets less light
      const k = 0.7 + 0.3 * Math.pow((shape + 1) / 2, 0.8);
      shade[i * 3] = shade[i * 3 + 1] = shade[i * 3 + 2] = k;
    }
    pos.needsUpdate = true;
    (geo.attributes.color as BufferAttribute).needsUpdate = true;
    geo.computeVertexNormals();
  };
  update(TRACK);
  return { mesh, update, side };
}

/* ---------- the lab ---------- */
export interface LabState {
  type: LabType;
  open: number;
}

export function createLab(canvas: HTMLCanvasElement, opts: { onChange?: (s: LabState) => void; pixelRatio?: number } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: false, powerPreference: 'default' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.pixelRatio ?? 2));
  renderer.setClearColor(0xf1ede6, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 30);

  /* room */
  const wallMat = new MeshStandardMaterial({ color: 0xf7f3ec, emissive: 0xf7f3ec, emissiveIntensity: 0.12, roughness: 0.95 });
  const room = new Group();
  scene.add(room);
  const box = (w: number, h: number, d: number, m: Material, x: number, y: number, z: number) => {
    const b = new Mesh(new BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    b.receiveShadow = true;
    room.add(b);
    return b;
  };
  const D = 0.22; // wall depth
  const WW = 9;
  box((WW - WX * 2) / 2, CEIL + 0.4, D, wallMat, -(WX + (WW - WX * 2) / 4), (CEIL + 0.4) / 2, -D / 2);
  box((WW - WX * 2) / 2, CEIL + 0.4, D, wallMat, WX + (WW - WX * 2) / 4, (CEIL + 0.4) / 2, -D / 2);
  box(WX * 2, SILL, D, wallMat, 0, SILL / 2, -D / 2);
  box(WX * 2, CEIL + 0.4 - HEAD, D, wallMat, 0, (HEAD + CEIL + 0.4) / 2, -D / 2);

  // floor and ceiling
  const floorTex = canvasTex(256, 256, (c) => {
    c.fillStyle = '#c9a77f';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = `hsl(32 ${34 + Math.random() * 8}% ${58 + Math.random() * 8}%)`;
      c.fillRect(0, i * 32 + 1, 256, 30);
      c.fillStyle = 'rgba(80,50,20,0.10)';
      c.fillRect(((i * 97) % 256), i * 32, 2, 32);
    }
  });
  floorTex.wrapS = floorTex.wrapT = RepeatWrapping;
  floorTex.repeat.set(3, 3);
  const floor = new Mesh(new PlaneGeometry(WW, 7), new MeshStandardMaterial({ map: floorTex, roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 3.5);
  floor.receiveShadow = true;
  room.add(floor);
  const ceil = new Mesh(new PlaneGeometry(WW, 7), new MeshStandardMaterial({ color: 0xfbfaf7, emissive: 0xf4f1ec, emissiveIntensity: 0.75, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, CEIL, 3.5);
  room.add(ceil);
  // skirting
  box(WW, 0.08, 0.02, new MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), 0, 0.04, 0.01);

  // window frame, glass and the garden outside
  const frameMat = new MeshStandardMaterial({ color: 0xfdfdfb, roughness: 0.45 });
  const f = 0.05;
  box(WX * 2 + f * 2, f, 0.08, frameMat, 0, HEAD + f / 2 - 0.01, -0.06);
  box(WX * 2 + f * 2, f, 0.12, frameMat, 0, SILL - f / 2 + 0.01, -0.04);
  box(f, HEAD - SILL, 0.08, frameMat, -WX - f / 2 + 0.01, (HEAD + SILL) / 2, -0.06);
  box(f, HEAD - SILL, 0.08, frameMat, WX + f / 2 - 0.01, (HEAD + SILL) / 2, -0.06);
  box(0.035, HEAD - SILL, 0.06, frameMat, 0, (HEAD + SILL) / 2, -0.1);
  box(WX * 2, 0.035, 0.06, frameMat, 0, SILL + (HEAD - SILL) * 0.68, -0.1);
  const glass = new Mesh(new PlaneGeometry(WX * 2, HEAD - SILL), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthWrite: false }));
  glass.position.set(0, (HEAD + SILL) / 2, -0.11);
  room.add(glass);
  const sky = new Mesh(
    new PlaneGeometry(9, 6),
    new MeshBasicMaterial({
      map: canvasTex(8, 256, (c) => {
        const g = c.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, '#8fc0ea');
        g.addColorStop(0.55, '#d8ebf8');
        g.addColorStop(0.62, '#b9d6a2');
        g.addColorStop(1, '#7fa86c');
        c.fillStyle = g;
        c.fillRect(0, 0, 8, 256);
      }),
    }),
  );
  sky.position.set(0, 1.6, -2.6);
  room.add(sky);

  // daylight on the floor, fading as the window is covered
  const patch = new Mesh(
    new PlaneGeometry(WX * 2.4, 2.4),
    new MeshBasicMaterial({
      map: canvasTex(64, 64, (c) => {
        const g = c.createRadialGradient(32, 10, 2, 32, 24, 34);
        g.addColorStop(0, 'rgba(255,248,230,0.9)');
        g.addColorStop(1, 'rgba(255,248,230,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
      }),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(0.15, 0.003, 1.25);
  room.add(patch);

  const hemi = new HemisphereLight(0xffffff, 0xe8dccb, 2.2);
  scene.add(hemi);
  const key = new DirectionalLight(0xfff6ea, 1.8);
  key.position.set(3.8, 3.6, 2.6);
  key.target.position.set(0, 1.4, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2.2;
  key.shadow.camera.right = 2.2;
  key.shadow.camera.top = 2.2;
  key.shadow.camera.bottom = -2.2;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 10;
  key.shadow.bias = -0.0008;
  key.shadow.radius = 6;
  scene.add(key, key.target);
  const rim = new DirectionalLight(0xdfeeff, 0.6);
  rim.position.set(-0.4, 2.2, -3);
  scene.add(rim);

  /* materials */
  const grain = weave();
  const fabric = (color: number, sheen = 0.6) =>
    new MeshPhysicalMaterial({ color, map: grain, roughness: 0.88, sheen, sheenRoughness: 0.55, sheenColor: new Color(0xffffff).multiplyScalar(0.35), side: DoubleSide });
  const metal = new MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.35, metalness: 0.7 });
  const lime = new MeshStandardMaterial({ color: 0xd4e5a0, roughness: 0.5 });
  const white = new MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.5 });
  const sheer = new MeshStandardMaterial({ color: 0xffffff, map: grain, roughness: 0.9, transparent: true, opacity: 0.42, side: DoubleSide, depthWrite: false });

  /* each type builds a group and a function that sets how open it is (0 closed, 1 open) */
  interface Build {
    group: Group;
    set: (o: number) => number; // returns how much light gets in (0..1)
    slow?: boolean;
    dark?: boolean; // blackout: the room really goes dark
    fit?: number; // half width the camera must show (blinds sit on the window, so they come closer)
  }
  const builders: Record<LabType, () => Build> = {
    pleated: () => curtains(fabric(0x9fb7d6), 'pleat'),
    ripple: () => curtains(fabric(0xe9e2d4), 'wave'),
    eyelet: () => curtains(fabric(0xb9c79a), 'eyelet'),
    blackout: () => ({ ...curtains(fabric(0x33456a, 0.4), 'pleat', 1), dark: true }),
    motorised: () => {
      const b = curtains(fabric(0xd8cdbd), 'wave', 0.85, true);
      b.slow = true;
      return b;
    },
    layers: () => {
      const g = new Group();
      const back = curtains(fabric(0x33456a, 0.4), 'pleat', 1, false, 2.92, 0.12);
      const front = curtains(sheer, 'wave', 0.3, false, 2.98, 0.22, true);
      g.add(back.group, front.group);
      return {
        group: g,
        dark: true,
        set: (o) => {
          const lb = back.set(clamp01(o * 2));
          const lf = front.set(clamp01(o * 2 - 1));
          return Math.min(lb + 0.08, lf * 0.6 + lb * 0.4);
        },
      };
    },
    roller: () => ({ ...roller(false), fit: 1.12 }),
    zebra: () => ({ ...roller(true), fit: 1.12 }),
    roman: () => ({ ...roman(), fit: 1.12 }),
    vertical: () => ({ ...vertical(), fit: 1.15 }),
    venetian: () => ({ ...venetian(), fit: 1.12 }),
  };

  function curtains(mat: Material, head: Head, density = 0.85, motor = false, top = 2.9, z = 0.16, thinRail = false): Build {
    const g = new Group();
    const L = makePanel(mat, 1, head, top, z);
    const R = makePanel(mat, -1, head, top, z);
    g.add(L.mesh, R.mesh);
    if (head === 'eyelet') {
      const rod = new Mesh(new CylinderGeometry(0.014, 0.014, TRACK * 2 + 0.3, 16), metal);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(0, top + 0.01, z);
      g.add(rod);
      for (const s of [-1, 1]) {
        const fin = new Mesh(new SphereGeometry(0.035, 16, 12), metal);
        fin.position.set(s * (TRACK + 0.17), top + 0.01, z);
        g.add(fin);
      }
    } else {
      const rail = new Mesh(new BoxGeometry(TRACK * 2 + 0.12, thinRail ? 0.02 : 0.035, 0.04), thinRail ? white : lime);
      rail.position.set(0, top + 0.03, z);
      g.add(rail);
      if (motor) {
        const m = new Mesh(new CylinderGeometry(0.035, 0.035, 0.26, 20), metal);
        m.position.set(TRACK + 0.04, top - 0.1, z);
        g.add(m);
      }
    }
    const rings: Mesh[] = [];
    if (head === 'eyelet') {
      for (const p of [L, R]) {
        for (let i = 0; i < 10; i++) {
          const r = new Mesh(new TorusGeometry(0.03, 0.006, 8, 20), metal);
          r.userData = { p, i };
          rings.push(r);
          g.add(r);
        }
      }
    }
    return {
      group: g,
      set: (o) => {
        const w = lerp(TRACK, 0.3, o);
        L.update(w);
        R.update(w);
        for (const r of rings) {
          const { p, i } = r.userData as { p: Panel; i: number };
          r.position.set(-p.side * TRACK + p.side * (i / 9) * w, top + 0.01, z);
        }
        // how much of the glass is still covered
        const covered = clamp01((Math.min(WX, -TRACK + w) + WX) / (WX * 2)) * 2;
        return clamp01(1 - Math.min(1, covered) * density);
      },
    };
  }

  function stripes(): Texture {
    const t = canvasTex(4, 64, (c) => {
      c.clearRect(0, 0, 4, 64);
      c.fillStyle = 'rgba(232,226,214,1)';
      c.fillRect(0, 0, 4, 32);
      c.fillStyle = 'rgba(250,248,244,0.28)';
      c.fillRect(0, 32, 4, 32);
    });
    t.wrapS = t.wrapT = RepeatWrapping;
    return t;
  }

  function roller(zebra: boolean): Build {
    const g = new Group();
    const W = WX * 2 + 0.16;
    const top = HEAD + 0.12;
    const full = top - SILL + 0.04;
    const z = 0.1;
    const cas = new Mesh(new BoxGeometry(W + 0.06, 0.1, 0.1), zebra ? white : lime);
    cas.position.set(0, top + 0.05, z);
    g.add(cas);
    const P = 0.1; // stripe period in metres
    let back: Mesh | null = null;
    let front: Mesh;
    let tb: Texture | null = null;
    let tf: Texture | null = null;
    if (zebra) {
      tb = stripes();
      tf = stripes();
      const mb = new MeshStandardMaterial({ map: tb, transparent: true, roughness: 0.9, side: DoubleSide, depthWrite: false });
      const mf = new MeshStandardMaterial({ map: tf, transparent: true, roughness: 0.9, side: DoubleSide, depthWrite: false });
      back = new Mesh(new PlaneGeometry(W, 1), mb);
      front = new Mesh(new PlaneGeometry(W, 1), mf);
      back.position.z = z - 0.012;
      front.position.z = z + 0.012;
      g.add(back);
    } else {
      front = new Mesh(new PlaneGeometry(W, 1), fabric(0xd9dcd5, 0.3));
      front.position.z = z;
    }
    g.add(front);
    const bar = new Mesh(new BoxGeometry(W, 0.03, 0.03), metal);
    g.add(bar);
    return {
      group: g,
      set: (o) => {
        // zebra: first the stripes line up to let light through, then it rolls up
        const phase = zebra ? clamp01(o / 0.35) : 0;
        const raise = zebra ? clamp01((o - 0.35) / 0.65) : o;
        const drop = Math.max(0.02, full * (1 - raise));
        for (const m of back ? [back, front] : [front]) {
          m.scale.y = drop;
          m.position.y = top - drop / 2;
        }
        if (tb && tf) {
          tb.repeat.set(1, drop / P);
          tf.repeat.set(1, drop / P);
          tb.offset.y = -drop / P;
          tf.offset.y = -drop / P + 0.5 * (1 - phase);
        }
        bar.position.set(0, top - drop, z + 0.015);
        const cover = clamp01((top - drop - SILL) / (HEAD - SILL));
        const through = zebra ? lerp(0.1, 0.55, phase) : 0.12;
        return clamp01(cover + (1 - cover) * through);
      },
    };
  }

  function roman(): Build {
    const g = new Group();
    const W = WX * 2 + 0.12;
    const top = HEAD + 0.1;
    const z = 0.09;
    const head = 0.32;
    const n = 6;
    const h = (top - SILL - head + 0.03) / n;
    const geo = new PlaneGeometry(W, 1, 1, n * 12 + 4);
    const pos = geo.attributes.position;
    const vs = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) vs[i] = 0.5 - pos.getY(i); // 0 at top, 1 at bottom
    const mesh = new Mesh(geo, fabric(0xe4d6bd));
    g.add(mesh);
    const rail = new Mesh(new BoxGeometry(W + 0.04, 0.05, 0.06), lime);
    rail.position.set(0, top + 0.02, z);
    g.add(rail);
    const bar = new Mesh(new BoxGeometry(W, 0.02, 0.02), metal);
    g.add(bar);
    const total = head + n * h;
    return {
      group: g,
      set: (o) => {
        const a = o * 1.38; // fold angle
        const e = h * Math.cos(a);
        const out = (h / 2) * Math.sin(a);
        let bottom = top;
        for (let i = 0; i < pos.count; i++) {
          const s = vs[i] * total; // distance along the fabric from the top
          let y: number;
          let zz = z;
          if (s <= head) {
            y = top - s;
          } else {
            const k = (s - head) / h;
            const sec = Math.min(n - 1, Math.floor(k));
            const t = k - sec;
            y = top - head - (sec + t) * e;
            zz = z + Math.sin(Math.PI * t) * out;
          }
          pos.setY(i, y);
          pos.setZ(i, zz);
          bottom = Math.min(bottom, y);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        bar.position.set(0, bottom, z + 0.01);
        const cover = clamp01((top - bottom - (top - HEAD)) / (HEAD - SILL));
        return clamp01(1 - cover * 0.88);
      },
    };
  }

  function vertical(): Build {
    const g = new Group();
    const n = 14;
    const W = WX * 2 + 0.2;
    const top = HEAD + 0.12;
    const z = 0.12;
    const slatW = W / n + 0.01;
    const rail = new Mesh(new BoxGeometry(W + 0.06, 0.05, 0.06), lime);
    rail.position.set(0, top + 0.03, z);
    g.add(rail);
    const mat = fabric(0xe6e1d6, 0.3);
    const slats: Mesh[] = [];
    for (let i = 0; i < n; i++) {
      const s = new Mesh(new BoxGeometry(slatW, top - SILL + 0.1, 0.004), mat);
      s.position.y = top - (top - SILL + 0.1) / 2;
      slats.push(s);
      g.add(s);
    }
    return {
      group: g,
      set: (o) => {
        const turn = clamp01(o / 0.5);
        const slide = clamp01((o - 0.5) / 0.5);
        const gap = lerp(W / n, 0.028, slide);
        slats.forEach((s, i) => {
          s.rotation.y = turn * 1.35;
          s.position.x = -W / 2 + slatW / 2 + i * gap;
          s.position.z = z;
        });
        const covered = clamp01((n * gap) / W);
        return clamp01(1 - covered * lerp(0.92, 0.25, turn));
      },
    };
  }

  function venetian(): Build {
    const g = new Group();
    const W = WX * 2 + 0.06;
    const top = HEAD + 0.06;
    const z = 0.08;
    const n = 26;
    const step = (top - SILL) / n;
    const wood = new MeshStandardMaterial({
      map: canvasTex(128, 8, (c) => {
        c.fillStyle = '#b5845a';
        c.fillRect(0, 0, 128, 8);
        for (let i = 0; i < 40; i++) {
          c.fillStyle = `rgba(70,40,15,${0.05 + Math.random() * 0.1})`;
          c.fillRect(Math.random() * 128, 0, 1 + Math.random() * 3, 8);
        }
      }),
      roughness: 0.6,
    });
    const rail = new Mesh(new BoxGeometry(W + 0.04, 0.05, 0.06), wood);
    rail.position.set(0, top + 0.03, z);
    g.add(rail);
    const slats: Mesh[] = [];
    for (let i = 0; i < n; i++) {
      const s = new Mesh(new BoxGeometry(W, 0.005, 0.05), wood);
      slats.push(s);
      g.add(s);
    }
    const cords = [-0.45, 0.45].map((x) => {
      const c = new Mesh(new BoxGeometry(0.008, 1, 0.008), new MeshStandardMaterial({ color: 0x8a6c4f }));
      c.position.set(x, 0, z);
      g.add(c);
      return c;
    });
    return {
      group: g,
      set: (o) => {
        const tilt = 1 - clamp01(o / 0.5); // 1 = closed, 0 = flat open
        const lift = clamp01((o - 0.5) / 0.5);
        const gap = lerp(step, 0.012, lift);
        let low = top;
        slats.forEach((s, i) => {
          s.rotation.x = tilt * 1.3;
          s.position.set(0, top - 0.04 - (i + 1) * gap, z);
          low = s.position.y;
        });
        for (const c of cords) {
          c.scale.y = top - low;
          c.position.y = (top + low) / 2;
        }
        const cover = clamp01((top - low - (top - HEAD)) / (HEAD - SILL));
        return clamp01(1 - cover * lerp(0.3, 0.95, tilt));
      },
    };
  }

  /* state */
  let type: LabType = 'ripple';
  let built: Build | null = null;
  let cur = 0.25;
  let target = 0.25;
  let az = 0.24;
  let azTarget = 0.24;
  let w = 0;
  let h = 0;
  let raf = 0;
  const look = new Vector3(0, 1.55, 0);
  let fit = 1.62;

  const frame = () => {
    const aspect = w / h || 1;
    const t = Math.tan((camera.fov * Math.PI) / 360);
    const blind = fit < 1.5;
    look.y = blind ? 1.72 : 1.55;
    const dist = Math.max((blind ? 1.18 : 1.6) / t, fit / (t * aspect)) + 0.45;
    camera.aspect = aspect;
    camera.position.set(Math.sin(az) * dist, look.y + 0.03, Math.cos(az) * dist);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
  };

  const apply = () => {
    if (!built) return;
    const raw = built.set(cur);
    const light = built.dark ? raw : lerp(0.62, 1, raw);
    hemi.intensity = lerp(0.5, 2.2, light);
    key.intensity = lerp(0.4, 1.8, light);
    rim.intensity = lerp(0.15, 0.6, light);
    (patch.material as MeshBasicMaterial).opacity = raw * 0.75;
  };

  const render = () => {
    frame();
    renderer.render(scene, camera);
  };

  const tick = () => {
    raf = 0;
    const speed = built?.slow ? 0.035 : 0.09;
    const d = target - cur;
    cur += Math.abs(d) < 0.002 ? d : d * speed + Math.sign(d) * 0.002;
    az += (azTarget - az) * 0.18;
    apply();
    render();
    opts.onChange?.({ type, open: cur });
    if (Math.abs(target - cur) > 0.0005 || Math.abs(azTarget - az) > 0.0005) raf = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const setType = (t: LabType, open?: number) => {
    if (built) {
      scene.remove(built.group);
      built.group.traverse((o) => (o as Mesh).geometry?.dispose());
    }
    type = t;
    built = builders[t]();
    fit = built.fit ?? 1.62;
    built.group.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) m.castShadow = true;
    });
    scene.add(built.group);
    if (open !== undefined) cur = target = open;
    apply();
    render();
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    render();
  };

  /* drag sideways to look around; vertical swipes still scroll the page */
  let dragX: number | null = null;
  const down = (e: PointerEvent) => {
    dragX = e.clientX;
  };
  const move = (e: PointerEvent) => {
    if (dragX === null) return;
    azTarget = Math.max(-0.6, Math.min(0.6, azTarget - (e.clientX - dragX) * 0.004));
    dragX = e.clientX;
    wake();
  };
  const up = () => {
    dragX = null;
  };
  canvas.addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  setType('ripple', 0.25);
  resize();

  return {
    setType,
    setOpen: (o: number, animate = true) => {
      target = clamp01(o);
      if (!animate) cur = target;
      wake();
      if (!animate) {
        apply();
        render();
      }
    },
    get open() {
      return target;
    },
    get type() {
      return type;
    },
    /** a picture of the current view, for card images */
    snapshot: (mime = 'image/webp', q = 0.82) => {
      render();
      return canvas.toDataURL(mime, q);
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      renderer.dispose();
    },
  };
}

export type Lab = ReturnType<typeof createLab>;
