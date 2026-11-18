// Services page: the 3D home flies to whichever service you are looking at in the list.
import { createEngine } from './engine';
import { POSE_INDEX, sample, type State } from './director';

interface Options {
  view: HTMLElement;
  canvas: HTMLCanvasElement;
  items: HTMLElement[];
  still: boolean;
}

const KEYS: (keyof State)[] = ['az', 'el', 'zoom', 'tx', 'ty', 'tz', 'roofLift', 'upperLift', 'cut', 'xray', 'elec', 'plumb', 'spr', 'ring', 'paint', 'fx', 'fy'];
const ease = (t: number) => t * t * (3 - 2 * t);

export function initExplorer({ view, canvas, items, still }: Options) {
  const mobile = matchMedia('(max-width: 899px)').matches;
  const eng = createEngine(canvas, mobile);
  let from: State = sample(0);
  let to: State = sample(0);
  let toIdx = 0;
  let t = 1;
  let current = '';

  function go(slug: string) {
    if (slug === current || POSE_INDEX[slug] == null) return;
    current = slug;
    from = mix(from, to, ease(Math.min(1, t)));
    toIdx = POSE_INDEX[slug];
    to = sample(toIdx);
    t = still ? 1 : 0;
    items.forEach((el) => el.toggleAttribute('data-active', el.dataset.slug === slug));
    if (still) draw(performance.now());
  }
  function mix(a: State, b: State, k: number) {
    const o = {} as State;
    for (const key of KEYS) o[key] = a[key] + (b[key] - a[key]) * k;
    return o;
  }

  function resize() {
    eng.resize(view.clientWidth, view.clientHeight);
  }
  const t0 = performance.now();
  let last = t0;
  let first = true;
  function draw(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t = Math.min(1, t + dt / 0.9);
    const s = mix(from, to, ease(t));
    const time = still ? 0 : (now - t0) / 1000;
    eng.frame(s, time, { wide: false, fx: 0, fy: mobile ? 0.04 : 0, baseH: 9.4, baseW: 11.5, zoom: 1 + (s.zoom - 1) * 0.72 });
    eng.applyState(s, toIdx, time, ease(t));
    eng.render();
    if (first) {
      first = false;
      view.classList.add('is-live');
    }
  }
  let running = false;
  function loop(now: number) {
    if (!running) return;
    draw(now);
    requestAnimationFrame(loop);
  }
  const start = () => {
    if (running || still) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  };

  // the item nearest the middle of the screen is the one shown; hover and focus also choose
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) go((en.target as HTMLElement).dataset.slug!);
    },
    { rootMargin: mobile ? '-62% 0px -30% 0px' : '-45% 0px -45% 0px' },
  );
  items.forEach((el) => {
    io.observe(el);
    el.addEventListener('pointerenter', () => go(el.dataset.slug!));
    el.addEventListener('focus', () => go(el.dataset.slug!));
  });

  const ro = new ResizeObserver(() => {
    resize();
    if (!running) draw(performance.now());
  });
  ro.observe(view);
  resize();
  draw(performance.now());
  if (!still) {
    new IntersectionObserver(([en]) => (en.isIntersecting && !document.hidden ? start() : (running = false))).observe(view);
    document.addEventListener('visibilitychange', () => (document.hidden ? (running = false) : start()));
    start();
  }
}
