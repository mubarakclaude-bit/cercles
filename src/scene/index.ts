// Home page: the 3D house travels with the page. Scroll position decides the pose.
import { MathUtils, Vector3 } from 'three';
import { createEngine } from './engine';
import { eased, POP, POSES, sample, weight } from './director';

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

  /* ---------- the page drives the camera and the text ---------- */
  // The home stays pinned while a tall invisible track scrolls by. Position along the track
  // decides which part of the house we are at (f = 0 for the banner, 1 for the first service, ...).
  const track = wrap.querySelector<HTMLElement>('.journey__track')!;
  const stage = wrap.querySelector<HTMLElement>('.journey__stage')!;
  const N = POSES.length;
  let trackTop = 0;
  let stepPx = 1;
  function measure() {
    trackTop = track.getBoundingClientRect().top + scrollY;
    stepPx = Math.max(1, (track.offsetHeight - 1.4 * stage.offsetHeight) / (N - 1));
  }
  let target_f = 0;
  let cur_f = 0;
  function readScroll() {
    target_f = MathUtils.clamp((scrollY - trackTop) / stepPx, 0, N - 1);
  }
  addEventListener('scroll', readScroll, { passive: true });

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
  const t0 = last;
  let firstFrame = true;
  let curStep = -1;

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
    const wide = W >= 900;
    eng.frame(s, time, {
      wide,
      fx: wide ? s.fx : 0,
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
  void MathUtils;
  return {
    destroy() {
      stop();
      ro.disconnect();
      eng.dispose();
    },
  };
}
