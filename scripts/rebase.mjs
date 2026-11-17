// Makes a built copy of the site work under a sub-path (for example GitHub Pages at /cercles/),
// tells search engines to stay away from it, and gathers the result in ./pages-out.
// Used only for test copies; the real site is built with a plain `npm run build`.
import { cp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.env.DEMO_BASE || '').replace(/\/$/, '');
if (!base) {
  console.log('No DEMO_BASE set, nothing to do.');
  process.exit(0);
}
const root = new URL('../', import.meta.url).pathname;
// Astro may put a sub-path build in dist/client/<base>/ or directly in dist/
const candidates = [join(root, 'dist/client', base), join(root, 'dist', base), join(root, 'dist/client'), join(root, 'dist')];
const site = candidates.find((d) => existsSync(join(d, 'index.html')));
if (!site) throw new Error('Built site not found in dist/');

const re = new RegExp(`(href|src|action)="/(?!/|${base.slice(1)}/)`, 'g');
async function walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) await walk(p);
    else if (name.endsWith('.html')) await writeFile(p, (await readFile(p, 'utf8')).replace(re, `$1="${base}/`));
  }
}
await walk(site);
await writeFile(join(site, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
await writeFile(join(site, '.nojekyll'), '');
const out = join(root, 'pages-out');
await rm(out, { recursive: true, force: true });
await cp(site, out, { recursive: true });
console.log(`Rebased ${site} to ${base}/ -> pages-out/`);
