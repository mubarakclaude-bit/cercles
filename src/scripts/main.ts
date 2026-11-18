// Small, dependency-free behaviour layer. Everything degrades gracefully without it.
const doc = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Header: solid on scroll, hide on scroll down ---------- */
const header = document.getElementById('header');
const fab = document.querySelector<HTMLElement>('.fab');
let lastY = scrollY;
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    if (header) {
      header.dataset.solid = String(y > 24);
      const menuOpen = document.body.dataset.menu === 'open';
      header.dataset.hidden = String(!menuOpen && y > 480 && y > lastY + 4);
      if (y < lastY - 4) header.dataset.hidden = 'false';
    }
    if (fab) fab.dataset.hidden = String(y < 360);
    lastY = y;
    ticking = false;
  });
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Footer: columns fold on phones ---------- */
if (matchMedia('(max-width: 833px)').matches) {
  document.querySelectorAll<HTMLDetailsElement>('.footer__col').forEach((d) => (d.open = false));
}

/* ---------- Mobile menu ---------- */
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
function setMenu(open: boolean) {
  if (!burger || !menu) return;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.dataset.open = String(open);
  document.body.dataset.menu = open ? 'open' : '';
  if (header) header.dataset.hidden = 'false';
}
burger?.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) setMenu(false);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});
matchMedia('(min-width: 1000px)').addEventListener('change', (m) => m.matches && setMenu(false));

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
if (reveals.length) {
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    reveals.forEach((el) => io.observe(el));
  }
}

/* ---------- The 3D home that travels with the page (loaded after first paint) ---------- */
const journey = document.querySelector<HTMLElement>('.journey');
if (journey) {
  const canvas = journey.querySelector<HTMLCanvasElement>('.journey__canvas');
  const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const flat = () => {
    journey.classList.add('journey--flat');
    journey.querySelector('.journey__pins')?.replaceChildren();
  };
  if (!canvas || saver) {
    flat();
  } else {
    const boot = () =>
      import('../scene/index')
        .then((m) => m.initJourney({ wrap: journey, canvas, still: reduce }))
        .catch(() => flat());
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const go = () => (idle ? idle(boot, { timeout: 1200 }) : setTimeout(boot, 250));
    document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
  }
}

/* ---------- Service pages: the same 3D home, held still on this service ---------- */
const partView = document.querySelector<HTMLElement>('.shero__view[data-part]');
if (partView) {
  const canvas = partView.querySelector<HTMLCanvasElement>('canvas');
  const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (canvas && !saver) {
    const boot = () =>
      import('../scene/part')
        .then((m) =>
          m.initPart({
            view: partView,
            canvas,
            slug: partView.dataset.part ?? '',
            pose: partView.dataset.pose ? Number(partView.dataset.pose) : undefined,
            orbit: partView.dataset.orbit === '1',
            still: reduce,
          }),
        )
        .catch(() => undefined);
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const go = () => (idle ? idle(boot, { timeout: 1500 }) : setTimeout(boot, 300));
    document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
  }
}

/* ---------- Services page: the home flies to the service you are looking at ---------- */
const exploreView = document.querySelector<HTMLElement>('[data-explore]');
if (exploreView) {
  const canvas = exploreView.querySelector<HTMLCanvasElement>('canvas');
  const items = [...document.querySelectorAll<HTMLElement>('.explore__item')];
  const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (canvas && !saver) {
    const boot = () =>
      import('../scene/explorer').then((m) => m.initExplorer({ view: exploreView, canvas, items, still: reduce })).catch(() => undefined);
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const go = () => (idle ? idle(boot, { timeout: 1500 }) : setTimeout(boot, 300));
    document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
  }
}

/* ---------- Process line fills as you read ---------- */
const process = document.querySelector<HTMLElement>('.process');
if (process) {
  const steps = [...process.querySelectorAll<HTMLElement>('.pstep')];
  const fill = () => {
    const r = process.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height || 1)));
    process.style.setProperty('--fill', p.toFixed(3));
    steps.forEach((s, i) => (s.dataset.on = String(p >= (i + 0.2) / steps.length)));
  };
  let pt = false;
  addEventListener(
    'scroll',
    () => {
      if (pt) return;
      pt = true;
      requestAnimationFrame(() => {
        fill();
        pt = false;
      });
    },
    { passive: true },
  );
  fill();
}

/* ---------- Lead tracking (only does anything when analytics are switched on) ---------- */
type Tracker = { gtag?: (...a: unknown[]) => void; clarity?: (...a: unknown[]) => void };
const track = (method: string, extra: Record<string, string> = {}) => {
  const w = window as unknown as Tracker;
  w.gtag?.('event', 'generate_lead', { method, page: location.pathname, ...extra });
  w.clarity?.('event', `lead_${method}`);
};
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a');
  if (!a) return;
  const h = a.getAttribute('href') ?? '';
  if (h.startsWith('tel:')) track('call');
  else if (h.includes('wa.me')) track('whatsapp');
  else if (h.startsWith('mailto:')) track('email');
});

/* ---------- Quote form -> WhatsApp (no server, no cost) ---------- */
document.querySelectorAll<HTMLFormElement>('form[data-whatsapp]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const lines = [
      'Hi Cercles, I would like a quotation.',
      `Name: ${d.get('name') ?? ''}`,
      `Phone: ${d.get('phone') ?? ''}`,
      `Service: ${d.get('service') ?? ''}`,
      `Location: ${d.get('area') ?? ''}`,
      d.get('details') ? `Details: ${d.get('details')}` : '',
    ].filter(Boolean);
    track('quote_form', { service: String(d.get('service') ?? '') });
    const num = form.dataset.whatsapp;
    open(`https://wa.me/${num}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    form.dispatchEvent(new CustomEvent('sent'));
  });
});

void doc;
