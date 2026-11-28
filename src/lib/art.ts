// Small line drawings of curtain styles and blind types, drawn as plain SVG (no images, almost no weight).
// Classes are styled in global.css (.art): l = line, t = thin line, g = glass, f = white fabric,
// s = tinted fabric, d = dark fabric, a = lime accent, w = wood, sh = sheer, k = solid ink.

const win = '<rect class="g" x="32" y="24" width="56" height="72" rx="2"/><path class="t" d="M60 24v72M32 60h56"/><path class="l" d="M27 96h66"/>';
const floor = '<path class="t" d="M6 110h108"/>';
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const lines = (xs: number[], y1: number, y2: number, cls = 't') => `<path class="${cls}" d="${xs.map((x) => `M${x} ${y1}V${y2}`).join('')}"/>`;
const waves = (x: number, y: number, n: number, w: number, dir = 1) =>
  range(n).map(() => `q${(w / 2) * dir} ${-5 * dir} ${w * dir} 0`).join(' ');

const pleatedPanel = (x: number) =>
  `<path class="f" d="M${x} 18h26l2 88H${x - 2}z"/>` +
  lines([x + 6, x + 13, x + 20], 27, 104) +
  `<path class="l" d="${[x + 5, x + 7, x + 12, x + 14, x + 19, x + 21].map((p) => `M${p} 18v8`).join('')}"/>`;

const ripplePanel = (x: number) =>
  `<path class="f" d="M${x} 21 ${waves(x, 21, 4, 7)} V106 ${waves(x, 106, 4, 7, -1)} Z"/>` +
  lines([x + 3.5, x + 10.5, x + 17.5, x + 24.5], 24, 103);

const eyeletPanel = (x: number) =>
  `<path class="f" d="M${x} 18 ${range(4).map(() => 'q3.5 6 7 0').join(' ')} L${x + 30} 106 H${x - 2} Z"/>` +
  lines([x + 3.5, x + 10.5, x + 17.5, x + 24.5], 25, 104) +
  range(5).map((i) => `<circle class="f" cx="${x + i * 7}" cy="17" r="2.3"/>`).join('');

const tube = (y = 16) => `<rect class="a" x="28" y="${y}" width="64" height="7" rx="3.5"/>`;

export const ART: Record<string, string> = {
  pleated: win + floor + '<path class="l" d="M12 16h96"/><circle class="k" cx="11" cy="16" r="2.5"/><circle class="k" cx="109" cy="16" r="2.5"/>' + pleatedPanel(15) + pleatedPanel(79),

  ripple: win + floor + '<rect class="a" x="10" y="13" width="100" height="4" rx="2"/>' + ripplePanel(14) + ripplePanel(78),

  eyelet: win + floor + '<path class="l" d="M8 17h104" stroke-width="2.2"/><circle class="k" cx="7" cy="17" r="3"/><circle class="k" cx="113" cy="17" r="3"/>' + eyeletPanel(14) + eyeletPanel(78),

  roman:
    win +
    '<path class="s" d="M30 22h60v40q-30 7-60 0z"/>' +
    '<path class="l" d="M30 32q30 7 60 0M30 42q30 7 60 0M30 52q30 7 60 0"/>' +
    '<path class="t" d="M60 66v16"/><circle class="a" cx="60" cy="84" r="2.5"/><rect class="a" x="28" y="18" width="64" height="5" rx="2.5"/>',

  roller:
    win + tube() + '<rect class="s" x="31" y="23" width="58" height="44"/><rect class="k" x="30" y="66" width="60" height="3" rx="1.5"/>' +
    '<path class="t" d="M94 23v40" stroke-dasharray="1.5 2.5"/><circle class="a" cx="94" cy="65" r="2"/>',

  zebra:
    win + tube() +
    range(8).map((i) => `<rect class="${i % 2 ? 'sh' : 's'}" x="31" y="${23 + i * 7}" width="58" height="7"/>`).join('') +
    '<rect class="k" x="30" y="79" width="60" height="3" rx="1.5"/>',

  vertical:
    floor + '<rect class="a" x="22" y="14" width="76" height="5" rx="2.5"/>' +
    range(8).map((i) => `<rect class="${i % 2 ? 's' : 'f'}" x="${25 + i * 9}" y="21" width="7" height="82" rx="1.5"/>`).join('') +
    '<path class="t" d="M101 19v52"/>',

  venetian:
    win + '<rect class="a" x="28" y="16" width="64" height="5" rx="2.5"/>' +
    range(10).map((i) => `<rect class="w" x="30" y="${25 + i * 7}" width="60" height="3.2" rx="1.6"/>`).join('') +
    '<path class="t" d="M45 21v72M75 21v72"/>',

  layers:
    win + floor + '<path class="l" d="M10 13h100M10 19h100"/>' +
    '<path class="s" d="M12 15h24v91H12zM84 15h24v91H84z"/>' + lines([18, 24, 30, 90, 96, 102], 20, 104) +
    '<path class="sh" d="M28 21h64v85H28z"/>' + lines([36, 44, 52, 60, 68, 76, 84], 24, 104, 'td'),

  blackout:
    floor + '<rect class="a" x="10" y="14" width="100" height="4" rx="2"/>' +
    '<path class="d" d="M12 18h48v88H12zM60 18h48v88H60z"/>' + lines([20, 30, 40, 50, 70, 80, 90, 100], 22, 104, 'tl') +
    '<path class="a" d="M100 2a6 6 0 1 0 6 9 5 5 0 1 1-6-9z"/>',

  motorised:
    win + floor + '<rect class="a" x="8" y="13" width="94" height="4" rx="2"/><rect class="k" x="100" y="10" width="13" height="10" rx="2.5"/>' +
    '<path class="f" d="M10 20 q2.5-5 5 0 t5 0 t5 0 t5 0 V106 H10z"/>' + lines([12.5, 17.5, 22.5, 27.5], 23, 104) +
    '<path class="f" d="M90 20 q2.5-5 5 0 t5 0 t5 0 V106 H90z"/>' + lines([92.5, 97.5, 102.5], 23, 104) +
    '<rect class="f" x="62" y="70" width="18" height="30" rx="3.5"/><circle class="a" cx="71" cy="85" r="4"/>' +
    '<path class="l" d="M84 64a12 12 0 0 1 8-8M86 70a18 18 0 0 1 12-12"/>',

  office:
    '<path class="t" d="M4 104h112"/>' +
    [8, 46, 84].map((x, i) =>
      `<rect class="g" x="${x}" y="28" width="28" height="60" rx="1.5"/><rect class="a" x="${x - 2}" y="22" width="32" height="6" rx="3"/>` +
      `<rect class="s" x="${x + 1}" y="28" width="26" height="${[22, 40, 12][i]}"/><rect class="k" x="${x}" y="${28 + [22, 40, 12][i]}" width="28" height="2.5" rx="1.2"/>`,
    ).join('') +
    '<path class="l" d="M30 104V92h60v12"/><rect class="f" x="48" y="78" width="22" height="14" rx="1.5"/>',

  measure:
    // wide drawing: 320 x 210
    '<rect class="g" x="110" y="62" width="100" height="100" rx="2"/><path class="t" d="M160 62v100M110 112h100"/>' +
    '<rect class="a" x="70" y="38" width="180" height="5" rx="2.5"/>' +
    '<path class="sh" d="M72 43h40v141H72zM208 43h40v141H208z"/>' +
    '<path class="t" d="M6 190h308"/>' +
    '<path class="l" d="M210 24h40M210 20v8M250 20v8M70 24h40M70 20v8M110 20v8"/>' +
    '<text x="230" y="13" text-anchor="middle">15–30 cm</text><text x="90" y="13" text-anchor="middle">15–30 cm</text>' +
    '<path class="l" d="M266 41v21M262 41h8M262 62h8"/><text x="276" y="56">above frame</text>' +
    '<path class="l" d="M266 184v6M262 184h8"/><text x="276" y="181">near floor</text>' +
    '<text x="160" y="210" text-anchor="middle">Fabric width ≈ 2 to 2½ × the track</text>',
};

export const artBox = (name: string) => (name === 'measure' ? '-34 -4 404 220' : '0 0 120 120');
