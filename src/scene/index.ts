// Home page: the 3D house travels with the page. Scroll position decides the pose.
import { MathUtils, Vector3 } from 'three';
import { createEngine } from './engine';
import { eased, POP, POSES, sample, weight } from './director';
import { initStepper } from './stepper';

interface Options {
  wrap: HTMLElement; // the whole journey section (house + the page content it travels with)
  canvas: HTMLCanvasElement;
  still: boolean;
}

export function initJourney({ wrap, canvas, still }: Options) {
  const mobile = matchMedia('(max-width: 899px)').matches;
  const eng = createEngine(canvas, mobile);
  const { world, cam } = eng;
  const pinsEl = wrap.querySelector<HTMLElement>('.journey__pins')!;
  const steps = [...wrap.querySelectorAll<HTMLElement>('.journey__panels .j-step')].sort((a, b) => Number(a.dataset.k) - Number(b.dataset.k));

  // Pins: real links, sitting on the part of the house the visitor is reading about
  const base = import.meta.env.BASE_URL;
  const pinFor = POSES.map((p, i) => {
    if (!p.slug || !world.pinPos[p.slug]) return null;
    const a = document.createElement('a');
    a.className = 'pin';
    a.href = `${base}services/${p.slug}/`;
    a.tabIndex = -1;
    a.style.setProperty('--pop', POP[p.slug] ?? '#396db5');
    a.innerHTML = `<i></i><span>${steps[i]?.dataset.label ?? p.slug}</span>`;
    pinsEl.appendChild(a);
    return a;
  });

  let W = 0;
  let H = 0;
  function resize() {
    W = canvas.clientWidth || wrap.clientWidth;
    H = canvas.clientHeight || innerHeight;
    eng.resize(W, H);
  }

  const tmp = new Vector3();
  let textRect: DOMRect | null = null;
  function placePins(e: number) {
    const cur = steps[Math.round(e)];
    textRect = cur ? (cur.querySelector('.j-card') as HTMLElement).getBoundingClientRect() : null;
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
      world.stage.localToWorld(tmp);
      tmp.project(cam);
      const x = (tmp.x * 0.5 + 0.5) * W;
      const y = (-tmp.y * 0.5 + 0.5) * H;
      // keep pins off the text: on phones the lower half is for text, on wide screens the text block
      const r = textRect;
      // the pin's label reaches out to one side, so test the whole pill, not just the dot
      const pw = el.offsetWidth || 160;
      const left = x > W * 0.52;
      const x0 = left ? x - pw : x - 12;
      const x1 = left ? x + 12 : x + pw;
      const overText = W < 900 ? y > H * 0.5 : !!r && x1 > r.left - 24 && x0 < r.right + 24 && y > r.top - 30 && y < r.bottom + 30;
      if (overText) {
        if (el.dataset.on !== '0') {
          el.dataset.on = '0';
          el.style.opacity = '0';
          el.tabIndex = -1;
        }
        return;
      }
      el.dataset.on = '1';
      el.classList.toggle('left', left);
      el.style.opacity = String(Math.min(1, wt * 1.5));
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }

  /* ---------- the page drives the camera and the text ---------- */
  // The home stays pinned while a tall invisible track scrolls by. Position along the track
  // decides which part of the house we are at (f = 0 for the banner, 1 for the first service, ...).
  const pin = wrap.querySelector<HTMLElement>('.journey__pin')!;
  const N = POSES.length;
  let trackTop = 0;
  let stepPx = 1;
  function measure() {
    // journey = one pinned screen + (N - 1) steps + a short hold at the end (0.4 of a screen)
    trackTop = wrap.getBoundingClientRect().top + scrollY;
    stepPx = Math.max(1, (wrap.offsetHeight - 1.4 * pin.offsetHeight) / (N - 1));
  }
  let target_f = 0;
  let cur_f = 0;
  function readScroll() {
    target_f = MathUtils.clamp((scrollY - trackTop) / stepPx, 0, N - 1);
    wake();
  }
  addEventListener('scroll', readScroll, { passive: true });

  // one scroll gesture moves exactly one part of the house
  const stepper = initStepper({ geom: () => ({ start: trackTop, step: stepPx, n: N }), reduce: still });

  // Text for each part: rises in from below, holds still, lifts away as the next one arrives.
  // The fade windows never overlap, so two blocks of text are never on screen together.
  const HOLD = 0.16;
  const FADE = 0.3;
  function placePanels(f: number) {
    const lift = W >= 900 ? 56 : 44;
    steps.forEach((el, k) => {
      const d = f - k;
      const a = Math.abs(d);
      let o = a <= HOLD ? 1 : Math.max(0, 1 - (a - HOLD) / FADE);
      o = o * o * (3 - 2 * o);
      const on = o > 0.55;
      el.style.setProperty('--o', o.toFixed(3));
      el.style.setProperty('--y', `${(-d * lift).toFixed(1)}px`);
      if (el.dataset.on !== String(on)) {
        el.dataset.on = String(on);
        if (on) el.removeAttribute('inert');
        else el.setAttribute('inert', '');
      }
    });
  }

  let visible = true;
  let running = false;
  let last = performance.now();
  let frames = 0;
  let slow = 0;
  let clock = 0; // animation time; only runs while drawing, so nothing jumps after a rest
  let firstFrame = true;
  let curStep = -1;

  function render(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    clock += dt;
    const time = still ? 0 : clock;
    if (still) cur_f = target_f;
    else {
      cur_f += (target_f - cur_f) * (1 - Math.exp(-dt * 10));
      if (Math.abs(target_f - cur_f) < 0.0004) cur_f = target_f;
    }
    const s = sample(cur_f);
    const e = eased(cur_f);
    const wide = W >= 900;
    eng.frame(s, time, {
      wide,
      // on narrower wide screens the text takes a bigger share, so move the house further aside
      fx: wide ? s.fx * (1 + Math.max(0, 1440 - W) / 1440) : 0,
      fy: wide ? s.fy : s.zoom < 1.05 ? 0.27 : 0.2,
      baseH: wide ? 10.8 : 10,
      baseW: wide ? 14.6 : 12.6,
      zoom: wide ? 1 + (s.zoom - 1) * 0.82 : Math.max(s.zoom, 1) * 0.92,
    });
    eng.applyState(s, e, time);
    placePins(e);
    placePanels(cur_f);
    const ci = Math.round(e);
    if (ci !== curStep) {
      curStep = ci;
      steps.forEach((st, i) => (st.dataset.current = String(i === ci)));
      wrap.style.setProperty('--pop-now', POSES[ci]?.slug ? POP[POSES[ci].slug] : '#396db5');
    }
    eng.render();
    if (firstFrame) {
      firstFrame = false;
      wrap.classList.add('is-live');
    }
    // adaptive quality: if the device struggles in the first seconds, drop resolution
    if (++frames > 20 && frames < 260) {
      if (dt > 0.036) slow++;
      if (frames % 20 === 0) {
        if (slow > 8) eng.lowerQuality();
        slow = 0;
      }
    }
  }

  // Draw only while something moves. Once the house has been still for a few seconds (at once in
  // the light mode) the last frame stays on screen and nothing is redrawn until the next scroll.
  let skip = false;
  let lastMove = performance.now();
  const restAfter = () => (eng.lite ? 300 : 4000);
  function loop(now: number) {
    if (!running) return;
    const settled = Math.abs(target_f - cur_f) < 0.0004;
    if (!settled) lastMove = now;
    if (settled && now - lastMove > restAfter()) {
      render(now);
      running = false;
      return;
    }
    skip = settled ? !skip : false;
    if (!skip) render(now);
    requestAnimationFrame(loop);
  }
  const start = () => {
    if (running || still) return;
    running = true;
    last = performance.now();
    lastMove = last;
    requestAnimationFrame(loop);
  };
  function wake() {
    if (!running && visible && !document.hidden) start();
  }
  eng.onDirty = () => (still ? render(performance.now()) : wake());
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
  void MathUtils;
  return {
    destroy() {
      stop();
      stepper.destroy();
      ro.disconnect();
      eng.dispose();
    },
  };
}
