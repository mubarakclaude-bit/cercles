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
import { eased, POP, POSES, sample, weight, type State } from './director';

interface Options {
  wrap: HTMLElement; // the whole journey section (house + the page content it travels with)
  canvas: HTMLCanvasElement;
  still: boolean;
}

export function initJourney({ wrap, canvas, still }: Options) {
  const mobile = matchMedia('(max-width: 899px)').matches;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  let dprCap = mobile ? 1.5 : 2;

  const scene = new Scene();
  const world: World = build();
  scene.add(world.root);

  scene.add(new HemisphereLight(0xf4f7ff, 0x8a96ad, 1.5));
  const sun = new DirectionalLight(0xfff4e6, 2.6);
  sun.position.set(-11, 24, 15);
  sun.castShadow = true;
  const sm = mobile ? 1024 : 2048;
  sun.shadow.mapSize.set(sm, sm);
  const sc = sun.shadow.camera;
  sc.left = -26;
  sc.right = 26;
  sc.top = 26;
  sc.bottom = -26;
  sc.near = 1;
  sc.far = 80;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  scene.add(sun);
  const fill = new DirectionalLight(0xdfe8ff, 0.5);
  fill.position.set(13, 9, -7);
  scene.add(fill);

  const cam = new OrthographicCamera(-10, 10, 10, -10, 0.1, 220);
  const target = new Vector3();
  const pinsEl = wrap.querySelector<HTMLElement>('.journey__pins')!;
  const steps = [...wrap.querySelectorAll<HTMLElement>('.j-step')].sort((a, b) => Number(a.dataset.k) - Number(b.dataset.k));
  const poseIndex: Record<string, number> = {};
  POSES.forEach((p, i) => p.slug && (poseIndex[p.slug] = i));

  // Pins: real links, sitting on the part of the house the visitor is reading about
  const pinFor = POSES.map((p, i) => {
    if (!p.slug || !world.pinPos[p.slug]) return null;
    const a = document.createElement('a');
    a.className = 'pin';
    a.href = `${import.meta.env.BASE_URL}services/${p.slug}/`;
    a.tabIndex = -1;
    a.style.setProperty('--pop', POP[p.slug] ?? '#3b6db5');
    a.innerHTML = `<i></i><span>${steps[i]?.dataset.label ?? p.slug}</span>`;
    pinsEl.appendChild(a);
    return a;
  });

  let W = 0;
  let H = 0;
  function resize() {
    W = canvas.clientWidth || wrap.clientWidth;
    H = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(W, H, false);
  }

  function frame(s: State, time: number) {
    const aspect = W / H;
    const wide = W >= 900;
    const baseH = wide ? 10.6 : 10;
    const baseW = wide ? 14.2 : 12.4;
    const z = wide ? 1 + (s.zoom - 1) * 0.82 : Math.max(s.zoom, 1) * 0.92;
    const halfH = Math.max(baseH, baseW / aspect) / z;
    const halfW = halfH * aspect;
    const fx = wide ? s.fx : 0;
    const fy = wide ? s.fy : s.zoom < 1.05 ? 0.27 : 0.2;
    cam.left = -halfW - fx * 2 * halfW;
    cam.right = halfW - fx * 2 * halfW;
    cam.top = halfH - fy * 2 * halfH;
    cam.bottom = -halfH - fy * 2 * halfH;
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

  const w = (e: number, slug: string) => weight(e, poseIndex[slug] ?? -9);
  const lastTint: Record<string, number> = {};
  const tmpC = new Color();
  function applyState(s: State, e: number, time: number) {
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
    setFade(f.walls, 1 - 0.9 * s.xray);
    setFade(f.skin, (1 - 0.7 * s.xray) * notCut, 0.01);
    setFade(f.glass, (1 - 0.6 * s.xray) * notCut, 0.01);
    setFade(f.roof, 1 - 0.97 * s.roofLift, 0.01);
    setFade(f.furn, 1 - 0.8 * s.util);
    setFade(f.curt, (1 - 0.8 * s.util) * notCut, 0.01);
    setFade(f.util, s.util, 0.01);
    world.gUtil.visible = s.util > 0.01;
    world.gUpper.position.y = s.upperLift * 16;
    world.gRoof.position.y = s.roofLift * 10 + s.upperLift * 16;
    for (const g of world.cuts) g.scale.y = 1 - 0.8 * s.cut;
    world.edgeMat.opacity = 0.3 + 0.3 * s.xray;

    // Each part pops to its own colour when the page reaches it; the finishing touch paints everything.
    for (const [key, list] of Object.entries(world.tints)) {
      let k: number;
      if (key === 'walls' || key === 'wing') k = s.paint;
      else if (key === 'lawn') k = Math.max(w(e, 'landscaping') * 0.8, w(e, 'irrigation') * 0.8, s.paint);
      else k = Math.max(w(e, key), s.paint * (key === 'painting-texturing' ? 0 : 1));
      k = Math.round(MathUtils.clamp(k, 0, 1) * 100) / 100;
      if (lastTint[key] === k) continue;
      lastTint[key] = k;
      for (const t of list) {
        t.m.color.copy(t.base).lerp(t.to, k);
        t.m.emissive.copy(t.to).multiplyScalar(0.2 * k);
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

    // sprinklers: soft streams, wet patches on the lawn
    const sp = s.spr;
    world.water.visible = sp > 0.02;
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
            const reach = 2.6 * (0.55 + 0.45 * sp);
            const r = reach * t;
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
      mat.opacity = (0.08 + 0.55 * s.ring) * (1 - i * 0.2);
      mat.color.set(s.ring > 0.7 ? '#3b6db5' : '#292a75');
    });
    world.stage.position.y = Math.sin(time * 0.8) * 0.1;
    void tmpC;
  }

  const tmp = new Vector3();
  function placePins(e: number) {
    POSES.forEach((p, i) => {
      const el = pinFor[i];
      if (!el) return;
      const wt = weight(e, i);
      if (wt <= 0.05) {
        if (el.dataset.on !== '0') {
          el.dataset.on = '0';
          el.style.opacity = '0';
          el.tabIndex = -1;
        }
        return;
      }
      tmp.copy(world.pinPos[p.slug]);
      // follow the floor or roof the pin belongs to when they lift away
      const lifted = ['roofing', 'aluminium-gutters'].includes(p.slug) ? 0 : 0;
      tmp.y += lifted;
      world.stage.localToWorld(tmp);
      tmp.project(cam);
      const x = (tmp.x * 0.5 + 0.5) * W;
      const y = (-tmp.y * 0.5 + 0.5) * H;
      el.dataset.on = '1';
      el.classList.toggle('left', x > W * 0.52);
      el.style.opacity = String(Math.min(1, wt * 1.5));
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }

  /* ---------- the page drives the camera ---------- */
  let centers: number[] = [];
  function measure() {
    const y0 = scrollY;
    centers = steps.map((s) => {
      const r = (s.querySelector('.j-card') ?? s).getBoundingClientRect();
      return y0 + r.top + r.height / 2;
    });
  }
  let target_f = 0;
  let cur_f = 0;
  function readScroll() {
    if (!centers.length) return;
    const ref = scrollY + innerHeight * (W >= 900 ? 0.5 : 0.6);
    let f = 0;
    if (ref >= centers[centers.length - 1]) f = centers.length - 1;
    else if (ref > centers[0]) {
      let i = 0;
      while (i < centers.length - 2 && ref >= centers[i + 1]) i++;
      f = i + (ref - centers[i]) / (centers[i + 1] - centers[i] || 1);
    }
    target_f = f;
  }
  addEventListener('scroll', readScroll, { passive: true });

  let visible = true;
  let running = false;
  let last = performance.now();
  let frames = 0;
  let slow = 0;
  const t0 = last;
  let firstFrame = true;
  const curStep = { i: -1 };

  function render(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const time = still ? 0 : (now - t0) / 1000;
    if (still) cur_f = target_f;
    else {
      cur_f += (target_f - cur_f) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target_f - cur_f) < 0.0004) cur_f = target_f;
    }
    const s = sample(cur_f);
    const e = eased(cur_f);
    frame(s, time);
    applyState(s, e, time);
    placePins(e);
    const ci = Math.round(e);
    if (ci !== curStep.i) {
      curStep.i = ci;
      steps.forEach((st, i) => (st.dataset.current = String(i === ci)));
      // the page picks up the colour of the part being shown
      const col = POSES[ci]?.slug ? POP[POSES[ci].slug] : '#3b6db5';
      wrap.style.setProperty('--pop-now', col);
    }
    renderer.render(scene, cam);
    if (firstFrame) {
      firstFrame = false;
      wrap.classList.add('is-live');
    }
    if (++frames > 40 && frames < 200) {
      if (dt > 0.034) slow++;
      if (frames % 40 === 0) {
        if (slow > 14 && dprCap > 1) {
          dprCap = Math.max(1, dprCap - 0.5);
          resize();
        }
        slow = 0;
      }
    }
  }

  function loop(now: number) {
    if (!running) return;
    render(now);
    requestAnimationFrame(loop);
  }
  const start = () => {
    if (running || still) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
  };

  const remeasure = () => {
    measure();
    readScroll();
    if (still) render(performance.now());
  };
  const ro = new ResizeObserver(() => {
    resize();
    remeasure();
    if (!running) render(performance.now());
  });
  ro.observe(canvas);
  ro.observe(wrap);
  resize();
  measure();
  readScroll();
  cur_f = target_f;
  document.fonts?.ready.then(remeasure);
  addEventListener('load', remeasure);

  if (still) {
    render(performance.now());
    addEventListener('scroll', () => requestAnimationFrame(() => render(performance.now())), { passive: true });
  } else {
    new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting;
        visible && !document.hidden ? start() : stop();
      },
      { rootMargin: '10% 0px' },
    ).observe(wrap);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : visible && start()));
    start();
  }

  return {
    destroy() {
      stop();
      ro.disconnect();
      world.dispose();
      renderer.dispose();
    },
  };
}
