// One gesture = one part of the house.
// While the home is pinned, a wheel notch, a trackpad swipe, a finger swipe or an arrow key moves
// exactly one step and glides there. At the two ends the page scrolls normally, so the visitor can
// always leave the tour. Scroll positions stay real (back button, links and search engines unaffected).

interface Opts {
  /** page offset of step 0, distance between steps, number of steps (read live, they change on resize) */
  geom: () => { start: number; step: number; n: number };
  reduce: boolean;
}

export function initStepper({ geom, reduce }: Opts) {
  const html = document.documentElement;
  let anim = 0; // rAF id while gliding
  let animEnd = 0; // time the glide finishes
  let lastWheel = 0;
  let lastMag = 0;
  let wheelLocked = false;
  let goal = -1; // step the current glide is heading to

  const pos = () => {
    const g = geom();
    return (scrollY - g.start) / g.step;
  };
  /** inside the pinned part (with a small margin), where steps apply */
  const inside = () => {
    const g = geom();
    const p = pos();
    return p > -0.02 && p < g.n - 1 + 0.02;
  };
  const blocked = (t: EventTarget | null) =>
    document.body.dataset.menu === 'open' ||
    (t instanceof Element && !!t.closest('input, textarea, select, [contenteditable], .no-step'));

  /** step to go to for a direction, or null when that direction leaves the tour */
  function targetFor(dir: 1 | -1, chain = false): number | null {
    const g = geom();
    const p = pos();
    // a swipe made while a glide is still running carries on from where that glide is heading
    const k = chain && gliding() && goal >= 0 ? goal + dir : dir > 0 ? Math.floor(p + 0.02) + 1 : Math.ceil(p - 0.02) - 1;
    if (k < 0 || k > g.n - 1) return null;
    return k;
  }

  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function glideTo(k: number) {
    const g = geom();
    goal = k;
    const to = Math.round(g.start + k * g.step);
    const from = scrollY;
    cancelAnimationFrame(anim);
    if (reduce || Math.abs(to - from) < 2) {
      scrollTo({ top: to, behavior: "instant" });
      animEnd = performance.now();
      return;
    }
    const dist = Math.abs(to - from);
    const dur = Math.min(1000, 620 + dist * 0.12);
    const t0 = performance.now();
    animEnd = t0 + dur;
    html.classList.add('is-gliding');
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo({ top: from + (to - from) * ease(t), behavior: "instant" });
      if (t < 1) anim = requestAnimationFrame(tick);
      else {
        anim = 0;
        html.classList.remove('is-gliding');
      }
    };
    anim = requestAnimationFrame(tick);
  }
  const gliding = () => anim !== 0 || performance.now() < animEnd;

  /* ---------- mouse wheel and trackpad ---------- */
  // A trackpad swipe sends a long stream of wheel events (with inertia). Only the first one of a
  // gesture moves a step; the rest are swallowed until the stream goes quiet or a fresh, stronger
  // push begins.
  function onWheel(e: WheelEvent) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || blocked(e.target)) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    const now = performance.now();
    const mag = Math.abs(e.deltaY);
    const quiet = now - lastWheel > 170;
    const freshPush = !gliding() && mag > 24 && mag > lastMag * 1.6;
    lastWheel = now;
    lastMag = mag;
    // still inside one gesture (or its inertia): swallow it so it cannot carry on to a second step
    const busy = gliding() || (wheelLocked && !quiet && !freshPush);
    if (!inside() && !busy) return;
    const k = targetFor(dir);
    if (k === null && !busy) return; // a fresh push out of either end: the page scrolls on normally
    e.preventDefault();
    if (busy || k === null) return;
    wheelLocked = true;
    glideTo(k);
  }
  // unlock once the stream has gone quiet after the glide
  setInterval(() => {
    if (wheelLocked && !gliding() && performance.now() - lastWheel > 170) wheelLocked = false;
  }, 60);

  /* ---------- touch ---------- */
  let ty = 0;
  let tx = 0;
  let tStart = 0;
  let tracking = false;
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1 || blocked(e.target)) {
      tracking = false;
      return;
    }
    tracking = inside() || gliding();
    ty = e.touches[0].clientY;
    tx = e.touches[0].clientX;
    tStart = performance.now();
  }
  function onTouchMove(e: TouchEvent) {
    if (!tracking) return;
    const dy = ty - e.touches[0].clientY;
    const dx = tx - e.touches[0].clientX;
    if (Math.abs(dx) > Math.abs(dy)) return;
    // at the ends, a swipe out of the tour scrolls the page normally
    if (!gliding() && targetFor(dy > 0 ? 1 : -1) === null) {
      tracking = false;
      return;
    }
    if (e.cancelable) e.preventDefault();
  }
  function onTouchEnd(e: TouchEvent) {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dy = ty - t.clientY;
    const fast = Math.abs(dy) / Math.max(1, performance.now() - tStart) > 0.3;
    if (Math.abs(dy) < 28 && !fast) return; // a tap, not a swipe
    if (Math.abs(dy) < 10) return;
    const k = targetFor(dy > 0 ? 1 : -1, true);
    if (k !== null) glideTo(k);
  }

  /* ---------- keyboard ---------- */
  function onKey(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey || blocked(e.target) || !inside()) return;
    const t = e.target as Element | null;
    if (t && t.closest('a, button') && (e.key === ' ' || e.key === 'Enter')) return;
    let dir: 1 | -1 | 0 = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
    if (!dir) return;
    const k = targetFor(dir, true);
    if (k === null) return;
    e.preventDefault();
    glideTo(k);
  }

  /* ---------- settle ---------- */
  // If the page comes to rest between two parts (a fling from below, a dragged scrollbar, a resize),
  // glide to the nearest one so a part is always shown whole.
  let settleTimer = 0;
  function onScroll() {
    if (gliding()) return;
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 140);
  }
  function settle() {
    if (gliding() || tracking || !inside()) return;
    const g = geom();
    const p = pos();
    const k = Math.round(p);
    if (Math.abs(p - k) * g.step > 3 && k >= 0 && k <= g.n - 1) glideTo(k);
  }

  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('touchstart', onTouchStart, { passive: true });
  addEventListener('touchmove', onTouchMove, { passive: false });
  addEventListener('touchend', onTouchEnd, { passive: true });
  addEventListener('keydown', onKey);
  addEventListener('scroll', onScroll, { passive: true });

  return {
    /** jump to a step (used by links into the tour) */
    go: glideTo,
    destroy() {
      removeEventListener('wheel', onWheel);
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchmove', onTouchMove);
      removeEventListener('touchend', onTouchEnd);
      removeEventListener('keydown', onKey);
      removeEventListener('scroll', onScroll);
    },
  };
}
