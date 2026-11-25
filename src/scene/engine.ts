// The shared 3D engine: builds the home once, then draws it for any pose.
// The home-page journey and the still view on each service page both use it.
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  OrthographicCamera,
  PCFShadowMap,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { build, type World } from './build';
import { POSE_INDEX, weight, type State } from './director';
import { loadNature } from './nature';
import { mute } from './tone';
import { Material, Mesh, MeshStandardMaterial } from 'three';

export interface View {
  wide: boolean; // desktop layout: shift the home sideways to make room for text
  fx: number;
  fy: number;
  baseH: number;
  baseW: number;
  zoom: number; // already adjusted for the screen
}

export function createEngine(canvas: HTMLCanvasElement, mobile: boolean) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  let dprCap = mobile ? 1.5 : 2;

  // No real graphics chip (software drawing, as in Google's speed test and some cheap phones):
  // start in the light mode straight away.
  let lite = false;
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    lite = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i.test(name);
  } catch {
    /* keep full quality */
  }
  // something changed that needs a fresh frame (for example the tree models finished loading)
  let onDirty: () => void = () => undefined;

  const scene = new Scene();
  const world: World = build();
  scene.add(world.root);

  // Start calm: soften every colour, except the wiring, pipes, water and glow that only appear when needed.
  const keep = new Set<Material>([world.haloMat, world.waterMat, world.wetMat, world.edgeMat]);
  for (const f of [...world.fades.elec, ...world.fades.plumb]) keep.add(f.m);
  const done = new Set<Material>();
  for (const list of Object.values(world.tints)) {
    for (const t of list) {
      t.base = mute(t.base);
      t.m.color.copy(t.base);
      done.add(t.m);
    }
  }
  world.root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[];
    for (const m of mats) {
      if (keep.has(m) || done.has(m) || !(m as MeshStandardMaterial).isMeshStandardMaterial) continue;
      const sm = m as MeshStandardMaterial;
      sm.color.copy(mute(sm.color));
      if (sm.emissiveIntensity > 0) sm.emissive.copy(mute(sm.emissive, 0.6));
      done.add(m);
    }
  });

  scene.add(new HemisphereLight(0xf7f9ff, 0x9aa4b8, 1.6));
  const sun = new DirectionalLight(0xfff3e2, 2.5);
  sun.position.set(-12, 25, 16);
  sun.castShadow = true;
  const sm = mobile ? 1024 : 2048;
  sun.shadow.mapSize.set(sm, sm);
  const sc = sun.shadow.camera;
  sc.left = -28;
  sc.right = 28;
  sc.top = 28;
  sc.bottom = -28;
  sc.near = 1;
  sc.far = 90;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  scene.add(sun);
  const fill = new DirectionalLight(0xdfe8ff, 0.5);
  fill.position.set(13, 9, -7);
  scene.add(fill);

  // swap in the real tree models once they have loaded (the hand-built ones stay if anything fails)
  loadNature(world, import.meta.env.BASE_URL)
    .then(() => onDirty())
    .catch(() => undefined);

  const cam = new OrthographicCamera(-10, 10, 10, -10, 0.1, 240);
  const target = new Vector3();
  let W = 1;
  let H = 1;

  function resize(w: number, h: number) {
    W = Math.max(1, w);
    H = Math.max(1, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(W, H, false);
  }

  function frame(s: State, time: number, v: View) {
    const aspect = W / H;
    const halfH = Math.max(v.baseH, v.baseW / aspect) / v.zoom;
    const halfW = halfH * aspect;
    cam.left = -halfW - v.fx * 2 * halfW;
    cam.right = halfW - v.fx * 2 * halfW;
    cam.top = halfH - v.fy * 2 * halfH;
    cam.bottom = -halfH - v.fy * 2 * halfH;
    cam.updateProjectionMatrix();
    const az = MathUtils.degToRad(s.az + Math.sin(time * 0.35) * 1.2);
    const el = MathUtils.degToRad(s.el);
    target.set(s.tx, s.ty, s.tz);
    cam.position.set(
      target.x + Math.cos(el) * Math.sin(az) * 90,
      target.y + Math.sin(el) * 90,
      target.z + Math.cos(el) * Math.cos(az) * 90,
    );
    cam.lookAt(target);
  }

  const w = (e: number, slug: string) => weight(e, POSE_INDEX[slug] ?? -9);
  const lastTint: Record<string, number> = {};
  const lastLen: Record<string, number> = {};
  function applyState(s: State, e: number, time: number, popScale = 1) {
    const f = world.fades;
    const setFade = (list: typeof f.walls, k: number, minVisible = 0) => {
      for (const it of list) {
        const o = it.base * k;
        it.m.opacity = o;
        it.m.depthWrite = o > 0.98;
        it.m.visible = o > minVisible;
      }
    };
    const notCut = 1 - s.cut;
    const sys = Math.max(s.elec, s.plumb);
    setFade(f.walls, 1 - 0.9 * s.xray);
    setFade(f.skin, (1 - 0.7 * s.xray) * notCut, 0.01);
    setFade(f.glass, (1 - 0.6 * s.xray) * notCut, 0.01);
    setFade(f.roof, 1 - 0.97 * s.roofLift, 0.01);
    setFade(f.furn, 1 - 0.8 * sys);
    setFade(f.curt, (1 - 0.8 * sys) * notCut, 0.01);
    setFade(f.elec, s.elec, 0.01);
    setFade(f.plumb, s.plumb, 0.01);
    world.gElec.visible = s.elec > 0.01;
    world.gPlumb.visible = s.plumb > 0.01;
    world.haloMat.opacity = 0.95 * s.elec;
    world.gUpper.position.y = s.upperLift * 16;
    world.gRoof.position.y = s.roofLift * 10 + s.upperLift * 16;
    for (const g of world.cuts) g.scale.y = 1 - 0.8 * s.cut;
    world.edgeMat.opacity = 0.18 + 0.3 * s.xray;

    // each part pops to its own colour when its section is reached; the finishing touch paints everything
    for (const [key, list] of Object.entries(world.tints)) {
      let k: number;
      if (key === 'walls' || key === 'wing') k = s.paint;
      else if (key === 'lawn') k = Math.max(w(e, 'landscaping') * 0.8 * popScale, w(e, 'irrigation') * 0.8 * popScale, s.paint);
      else k = Math.max(w(e, key) * popScale, key === 'painting-texturing' ? 0 : s.paint);
      k = Math.round(MathUtils.clamp(k, 0, 1) * 100) / 100;
      if (lastTint[key] === k && lastLen[key] === list.length) continue;
      lastTint[key] = k;
      lastLen[key] = list.length;
      for (const t of list) {
        t.m.color.copy(t.base).lerp(t.to, k);
        t.m.emissive.copy(t.to).multiplyScalar(0.18 * k);
      }
    }

    for (const p of world.pulses) {
      const d = ((time * p.speed + p.k) % 1) * p.path.total;
      let i = 1;
      while (i < p.path.len.length - 1 && p.path.len[i] < d) i++;
      const seg = p.path.len[i] - p.path.len[i - 1] || 1;
      p.mesh.position.lerpVectors(p.path.pts[i - 1], p.path.pts[i], MathUtils.clamp((d - p.path.len[i - 1]) / seg, 0, 1));
    }
    world.hub.rotation.y = time * 0.5;
    world.hub.scale.setScalar(1.1 + Math.sin(time * 2.2) * 0.06);
    world.core.scale.setScalar(0.28 + Math.sin(time * 3.1) * 0.05);

    // sprinklers: soft streams and wet patches, only when the page is about the garden
    const sp = s.spr;
    world.water.visible = sp > 0.03;
    world.wetMat.opacity = 0.2 * Math.min(1, sp * 1.3);
    if (world.water.visible) {
      world.waterMat.opacity = 0.95 * Math.min(1, sp * 1.4);
      const { wPos, heads, JET, per } = world;
      let o = 0;
      for (let h = 0; h < heads.length; h++) {
        const head = heads[h];
        for (let j = 0; j < JET; j++) {
          const ang = time * (1.1 + h * 0.06) + h * 1.9 + (j * Math.PI * 2) / JET;
          for (let k = 0; k < per; k++) {
            const t = (time * 0.85 + k / per) % 1;
            const r = 2.6 * (0.55 + 0.45 * sp) * t;
            wPos[o++] = head.x + Math.cos(ang + t * 0.15) * r;
            wPos[o++] = head.y + (5.0 * t - 5.0 * t * t) * 0.78 * sp + 0.12;
            wPos[o++] = head.z + Math.sin(ang + t * 0.15) * r;
          }
        }
      }
      world.wGeo.attributes.position.needsUpdate = true;
    }

    for (const sw of world.sways) {
      sw.g.rotation.z = Math.sin(time * 1.1 + sw.ph) * sw.amp;
      sw.g.rotation.x = Math.cos(time * 0.9 + sw.ph) * sw.amp * 0.7;
    }
    world.rings.forEach((r, i) => {
      const mat = r.mesh.material as unknown as { opacity: number; color: Color };
      const breath = 1 + Math.sin(time * 0.9 - i * 0.7) * 0.025 * s.ring;
      r.mesh.scale.setScalar(breath * (0.75 + 0.25 * Math.min(1, s.ring * 1.4)) * (1 + 0.14 * s.ring * (i + 1) * 0.5));
      mat.opacity = (0.06 + 0.5 * s.ring) * (1 - i * 0.2);
    });
    world.stage.position.y = Math.sin(time * 0.8) * 0.1;
  }

  /** Light mode: no shadows and 1x resolution. Returns false when already light. */
  function goLite() {
    if (lite && !renderer.shadowMap.enabled) return false;
    lite = true;
    dprCap = 1;
    renderer.shadowMap.enabled = false;
    sun.castShadow = false;
    scene.traverse((o) => {
      const m = (o as Mesh).material as Material | Material[] | undefined;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => (x.needsUpdate = true));
    });
    resize(W, H);
    return true;
  }
  if (lite) {
    lite = false;
    goLite();
  }

  return {
    world,
    cam,
    scene,
    resize,
    frame,
    applyState,
    render: () => renderer.render(scene, cam),
    size: () => ({ W, H }),
    /** Drop resolution one notch when the device is struggling. Returns false when it cannot go lower. */
    lowerQuality() {
      if (dprCap <= 1) return goLite();
      dprCap = Math.max(1, dprCap - 0.5);
      resize(W, H);
      return true;
    },
    /** true when the light mode is on (no shadows, lower resolution, no idle motion) */
    get lite() {
      return lite;
    },
    set onDirty(fn: () => void) {
      onDirty = fn;
    },
    dispose() {
      world.dispose();
      renderer.dispose();
    },
  };
}
export type Engine = ReturnType<typeof createEngine>;
