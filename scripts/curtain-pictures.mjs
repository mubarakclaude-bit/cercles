// Saves a picture of each curtain model into public/curtains/. Needs a temporary page src/pages/render-curtains.astro that puts createLab() on window.__lab (see git history, commit after e2e55b9), then: astro build, astro preview, node scripts/curtain-pictures.mjs public/curtains '[["ripple",0.35],...]'
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const OUT = process.argv[2];
const TYPES = JSON.parse(process.argv[3]);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333 + Math.floor(Math.random() * 300);
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--no-first-run', '--enable-gpu', '--use-angle=metal', '--window-size=900,700', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sleep(200);
}
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Emulation.setDeviceMetricsOverride', { width: 900, height: 700, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:4321/render-curtains/' });
await sleep(3000);
mkdirSync(OUT, { recursive: true });
for (const [t, o] of TYPES) {
  const r = await ev(`(async () => { __lab.setType('${t}', ${o}); await new Promise(r => setTimeout(r, 150));
    const big = __lab.snapshot('image/webp', 0.8);
    const img = new Image(); img.src = big; await img.decode();
    const c = document.createElement('canvas'); c.width = 480; c.height = 360; c.getContext('2d').drawImage(img, 0, 0, 480, 360);
    return [big, c.toDataURL('image/webp', 0.8)]; })()`);
  writeFileSync(join(OUT, `${t}.webp`), Buffer.from(r[0].split(',')[1], 'base64'));
  writeFileSync(join(OUT, `${t}-s.webp`), Buffer.from(r[1].split(',')[1], 'base64'));
  console.log(t, Math.round(r[0].length * 0.75 / 1024) + 'k', Math.round(r[1].length * 0.75 / 1024) + 'k');
}
proc.kill();
process.exit(0);
