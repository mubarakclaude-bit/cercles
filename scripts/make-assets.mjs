// One-off generator for favicon, app icons and the social share image, from the supplied brand files.
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url).pathname;
const brand = `${root}src/assets/brand/`;
const NAVY = '#0c0d2e';

const markSvg = await readFile(`${brand}BRANDMARK/CERCLES_BRANDMARK LIME GREEN.svg`, 'utf8');
const inner = markSvg.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<defs>[\s\S]*?<\/defs>/, '');
const fill = '#d3e59f';
const markGroup = `<g fill="${fill}">${inner.replace(/class="cls-1"/g, '')}</g>`;

const iconSvg = (size, pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 566.93 566.93"><rect width="566.93" height="566.93" fill="${NAVY}"/><g transform="translate(${pad} ${pad}) scale(${(566.93 - pad * 2) / 566.93})">${markGroup}</g></svg>`;

await writeFile(`${root}public/favicon.svg`, iconSvg(512, 70));
await sharp(Buffer.from(iconSvg(180, 70))).png().toFile(`${root}public/apple-touch-icon.png`);
await sharp(Buffer.from(iconSvg(192, 60))).png().toFile(`${root}public/icon-192.png`);
await sharp(Buffer.from(iconSvg(512, 60))).png().toFile(`${root}public/icon-512.png`);

// Social share image 1200x630
const logo = await sharp(`${brand}PRIMARY LOGO/CERCLES_PRIMARY LOGO LIME GREEN.png`).trim().resize({ width: 360 }).png().toBuffer();
const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="g" cx="80%" cy="40%" r="60%"><stop offset="0" stop-color="#3b6db5" stop-opacity=".5"/><stop offset="1" stop-color="#3b6db5" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="${NAVY}"/><rect width="1200" height="630" fill="url(#g)"/>
<g fill="none" stroke="#d3e59f" stroke-opacity=".28" stroke-width="2"><circle cx="1010" cy="315" r="300"/><circle cx="1010" cy="315" r="220" stroke-opacity=".2"/><circle cx="1010" cy="315" r="140" stroke-opacity=".14"/></g>
<text x="80" y="330" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="92" fill="#eef7f5" letter-spacing="-3">Roof to Garden.</text>
<text x="80" y="430" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="92" fill="#d3e59f" letter-spacing="-3">One Call.</text>
<text x="80" y="520" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#eef7f5" fill-opacity=".8">One-stop home solutions · Kozhikode &amp; Kerala</text>
</svg>`);
await sharp(text).composite([{ input: logo, left: 80, top: 80 }]).png({ compressionLevel: 9 }).toFile(`${root}public/og.png`);
console.log('assets done');
