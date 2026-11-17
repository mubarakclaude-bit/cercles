// A service page: the same 3D home, held still on the part the page is about.
import { createEngine } from './engine';
import { POSE_INDEX, sample } from './director';

interface Options {
  view: HTMLElement; // the container that holds the canvas
  canvas: HTMLCanvasElement;
  slug: string;
  still: boolean;
}

export function initPart({ view, canvas, slug, still }: Options) {
  const mobile = matchMedia('(max-width: 899px)').matches;
  const eng = createEngine(canvas, mobile);
  const idx = POSE_INDEX[slug] ?? 0;
  const s = sample(idx);

  function resize() {
    eng.resize(view.clientWidth, view.clientHeight);
  }
  const t0 = performance.now();
  let running = false;
  let visible = true;
  let frames = 0;
  let slow = 0;
  let last = t0;
  let first = true;

  function render(now: number) {
    const time = still ? 0 : (now - t0) / 1000;
    const wide = view.clientWidth >= 900;
    eng.frame(s, time, {
      wide,
      fx: wide ? 0.26 : 0,
      fy: wide ? 0 : 0.2,
      baseH: wide ? 10.8 : 10,
      baseW: wide ? 14.6 : 12.6,
      zoom: wide ? 1 + (s.zoom - 1) * 0.82 : Math.max(s.zoom, 1) * 0.92,
    });
    eng.applyState(s, idx, time);
    eng.render();
    if (first) {
      first = false;
      view.classList.add('is-live');
    }
    const dt = (now - last) / 1000;
    last = now;
    if (++frames > 20 && frames < 200) {
      if (dt > 0.04) slow++;
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
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) render(performance.now());
  });
  ro.observe(view);
  resize();
  render(performance.now());
  if (!still) {
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !document.hidden) start();
      else running = false;
    }).observe(view);
    document.addEventListener('visibilitychange', () => (document.hidden ? (running = false) : visible && start()));
    start();
  }
  return {
    destroy() {
      running = false;
      ro.disconnect();
      eng.dispose();
    },
  };
}
