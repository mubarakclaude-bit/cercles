import { initStepper } from '../scene/stepper';
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

/* ---------- Services orbit: point at a circle to see the service; it walks on its own until you do ---------- */
const orbit = document.querySelector<HTMLElement>('[data-orbit-root]');
if (orbit) {
  const nodes = [...orbit.querySelectorAll<HTMLAnchorElement>('.orbit__node')];
  const cat = orbit.querySelector<HTMLElement>('.orbit__cat')!;
  const name = orbit.querySelector<HTMLElement>('.orbit__name')!;
  const sum = orbit.querySelector<HTMLElement>('.orbit__sum')!;
  const go = orbit.querySelector<HTMLAnchorElement>('.orbit__go')!;
  let i = -1;
  let user = false;
  const show = (k: number) => {
    i = k;
    const n = nodes[k];
    nodes.forEach((x) => x.toggleAttribute('data-active', x === n));
    orbit.style.setProperty('--pop', getComputedStyle(n.parentElement!).getPropertyValue('--pop'));
    cat.textContent = n.dataset.cat ?? '';
    name.textContent = n.dataset.name ?? '';
    sum.textContent = n.dataset.sum ?? '';
    go.href = n.href;
    go.firstChild!.textContent = 'Open ';
  };
  nodes.forEach((n, k) => {
    n.addEventListener('pointerenter', () => ((user = true), show(k)));
    n.addEventListener('focus', () => ((user = true), show(k)));
  });
  if (!reduce) {
    let timer = 0;
    const tick = () => {
      if (!user && !document.hidden) show((i + 1) % nodes.length);
      timer = window.setTimeout(tick, 2600);
    };
    new IntersectionObserver(([en]) => {
      clearTimeout(timer);
      if (en.isIntersecting) timer = window.setTimeout(tick, 1200);
    }).observe(orbit);
    orbit.addEventListener('pointerleave', () => (user = false));
  }
}

/* ---------- Scroll-linked pieces: the circle that closes, the statement that lights up ---------- */
const scrollers = [...document.querySelectorAll<HTMLElement>('[data-cstory], [data-statement]')];
if (scrollers.length) {
  const update = () => {
    for (const el of scrollers) {
      const r = el.getBoundingClientRect();
      const span = el.hasAttribute('data-cstory') ? r.height - innerHeight : r.height + innerHeight * 0.4;
      const start = el.hasAttribute('data-cstory') ? -r.top : innerHeight * 0.85 - r.top;
      const p = reduce ? 1 : Math.min(1, Math.max(0, start / (span || 1)));
      el.style.setProperty('--p', p.toFixed(4));
      if (el.hasAttribute('data-cstory')) {
        const steps = el.querySelectorAll<HTMLElement>('.cstory__step');
        const k = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
        steps.forEach((s, j) => (s.dataset.on = String(j === k)));
        el.dataset.step = String(k);
      }
    }
  };
  let t = false;
  addEventListener('scroll', () => {
    if (t) return;
    t = true;
    requestAnimationFrame(() => ((t = false), update()));
  }, { passive: true });
  addEventListener('resize', update);
  update();

  // the circle story moves one step per scroll, like the home tour
  for (const el of scrollers) {
    if (!el.hasAttribute('data-cstory')) continue;
    const n = el.querySelectorAll('.cstory__step').length;
    initStepper({
      reduce,
      geom: () => {
        const r = el.getBoundingClientRect();
        const step = Math.max(1, (r.height - innerHeight) / n);
        // each step is held around the middle of its share of the scroll
        return { start: r.top + scrollY + step * 0.5, step, n };
      },
    });
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

/* ---------- Quote form: emailed through Web3Forms (free), or sent on WhatsApp ---------- */
document.querySelectorAll<HTMLFormElement>('form[data-quote]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('.form__status')!;
  const send = form.querySelector<HTMLButtonElement>('[data-send]')!;
  const val = (k: string) => String(new FormData(form).get(k) ?? '').trim();
  const say = (msg: string, kind: 'ok' | 'err' | 'wait') => {
    status.hidden = false;
    status.textContent = msg;
    status.dataset.kind = kind;
  };
  const waText = () =>
    [
      'Hi Cercles, I would like a quotation.',
      `Name: ${val('name')}`,
      `Phone: ${val('phone')}`,
      `Service: ${val('service')}`,
      val('area') ? `Location: ${val('area')}` : '',
      val('details') ? `Details: ${val('details')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  const openWa = () => open(`https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(waText())}`, '_blank', 'noopener');

  form.querySelector('[data-wa]')?.addEventListener('click', () => {
    if (!form.reportValidity()) return;
    track('quote_whatsapp', { service: val('service') });
    openWa();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity() || send.disabled) return;
    if ((form.elements.namedItem('botcheck') as HTMLInputElement | null)?.checked) return;
    send.disabled = true;
    say('Sending…', 'wait');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: form.dataset.key,
          subject: `New enquiry: ${val('service')} – ${val('name')}`,
          from_name: 'Cercles website',
          name: val('name'),
          phone: val('phone'),
          service: val('service'),
          location: val('area') || 'Not given',
          details: val('details') || 'None',
          page: location.href,
          botcheck: false,
        }),
      });
      const out = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (!res.ok || !out.success) throw new Error('failed');
      track('quote_form', { service: val('service') });
      form.reset();
      say(`Thank you. Your enquiry has reached Cercles. We will call you within one working day.`, 'ok');
    } catch {
      say('Sorry, that did not go through. Please try again, or use “Send on WhatsApp”.', 'err');
    } finally {
      send.disabled = false;
    }
  });
});

void doc;
