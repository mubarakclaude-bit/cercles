// One camera pose per place on the page: the banner, then each service in reading order.
export interface Pose {
  slug: string; // service this pose is about ('' for overview)
  az: number; // camera azimuth, degrees
  el: number; // camera elevation, degrees
  zoom: number;
  t: [number, number, number]; // look-at point
  roofLift?: number; // roof floats up and away
  upperLift?: number; // upper floor floats up too, opening the ground floor from above
  cut?: number; // front and right walls drop low, like a dollhouse cutaway
  xray?: number; // walls turn to glass
  elec?: number; // electrical: wires, switches, lit bulbs
  plumb?: number; // plumbing: supply and drain pipes, taps, tank
  spr?: number; // sprinklers
  ring?: number; // circles on the lawn
  paint?: number; // 1 = the whole home in colour
  fx?: number; // horizontal shift of the house on wide screens (+ moves it right)
  fy?: number; // vertical shift on wide screens (+ moves it up)
}

/** The colour each part pops to when the page reaches it. */
export const POP: Record<string, string> = {
  roofing: '#ff6a4d',
  'aluminium-gutters': '#00b3a4',
  'acp-facade': '#2f6bff',
  'aluminium-fabrication': '#8b5cf6',
  'interior-works': '#ffb020',
  curtains: '#ff4f9a',
  'sofa-making': '#5b5cf0',
  'furniture-works': '#ff8a1f',
  electrical: '#ffc400',
  plumbing: '#1e90ff',
  landscaping: '#2fbf5b',
  irrigation: '#12b5e5',
  'painting-texturing': '#ff6a4d',
};

/** Which chapter of the tour each service belongs to (for the small label above each title). */
export const CHAPTER: Record<string, string> = {
  roofing: 'Exteriors',
  'aluminium-gutters': 'Exteriors',
  'acp-facade': 'Exteriors',
  'aluminium-fabrication': 'Exteriors',
  'interior-works': 'Interiors',
  curtains: 'Interiors',
  'sofa-making': 'Interiors',
  'furniture-works': 'Interiors',
  electrical: 'Light & water',
  plumbing: 'Light & water',
  landscaping: 'Outdoors',
  irrigation: 'Outdoors',
  'painting-texturing': 'The finishing touch',
};

export const POSES: Pose[] = [
  { slug: '', az: 45, el: 32, zoom: 0.72, t: [0.5, 2.6, 0.5], spr: 0, ring: 0.35, fx: 0.28 },
  // Exteriors
  { slug: 'roofing', az: 40, el: 30, zoom: 2.0, t: [-1.2, 8.4, 0.3], spr: 0, fx: -0.24 },
  { slug: 'aluminium-gutters', az: 30, el: 26, zoom: 2.4, t: [-3.4, 6.4, 4.2], spr: 0, fx: 0.24 },
  { slug: 'acp-facade', az: 36, el: 28, zoom: 2.1, t: [-3.2, 5.6, 3.6], spr: 0, fx: -0.24 },
  { slug: 'aluminium-fabrication', az: 50, el: 28, zoom: 2.3, t: [0.8, 4.8, 4.6], spr: 0, fx: 0.24 },
  // Interiors: the roof lifts, then the upper floor, and the home opens up
  { slug: 'interior-works', az: 52, el: 42, zoom: 1.4, t: [-2.2, 1.0, 0], roofLift: 1, upperLift: 1, cut: 1, spr: 0, fx: -0.17 },
  { slug: 'curtains', az: 36, el: 28, zoom: 2.2, t: [-2.6, 2.0, 3.0], roofLift: 1, upperLift: 1, xray: 0.5, spr: 0, fx: 0.2 },
  { slug: 'sofa-making', az: 54, el: 40, zoom: 2.2, t: [-3.0, 0.8, -1.6], roofLift: 1, upperLift: 1, cut: 1, spr: 0, fx: -0.2 },
  { slug: 'furniture-works', az: 58, el: 36, zoom: 1.9, t: [-3.4, 4.6, -1.0], roofLift: 1, cut: 1, spr: 0, fx: 0.24 },
  // Behind the walls
  { slug: 'electrical', az: 24, el: 31, zoom: 1.5, t: [-2.2, 3.4, 0.5], roofLift: 1, xray: 1, elec: 1, spr: 0, fx: -0.24 },
  { slug: 'plumbing', az: 66, el: 31, zoom: 1.55, t: [3.6, 3.2, -1.8], roofLift: 1, xray: 1, plumb: 1, spr: 0, fx: 0.24 },
  // Outdoors
  { slug: 'landscaping', az: 48, el: 28, zoom: 1.5, t: [-7.4, 1.4, 1.6], spr: 0.6, fx: -0.24 },
  { slug: 'irrigation', az: 40, el: 30, zoom: 1.9, t: [-3.2, 0.6, 6.4], spr: 1, fx: 0.24 },
  // The finishing touch: everything you saw, now in colour
  { slug: 'painting-texturing', az: 46, el: 33, zoom: 1.1, t: [0.5, 2.8, 0.8], spr: 0.25, paint: 1, ring: 0.5, fx: -0.24 },
  // The circle closes
  { slug: '', az: 46 + 360, el: 36, zoom: 0.95, t: [0.5, 2.8, 0.8], spr: 0.2, ring: 1, paint: 1, fx: 0, fy: 0.16 },
];

export interface State {
  az: number;
  el: number;
  zoom: number;
  tx: number;
  ty: number;
  tz: number;
  roofLift: number;
  upperLift: number;
  cut: number;
  xray: number;
  elec: number;
  plumb: number;
  spr: number;
  ring: number;
  paint: number;
  fx: number;
  fy: number;
}

const base = (p: Pose): State => ({
  az: p.az,
  el: p.el,
  zoom: p.zoom,
  tx: p.t[0],
  ty: p.t[1],
  tz: p.t[2],
  roofLift: p.roofLift ?? 0,
  upperLift: p.upperLift ?? 0,
  cut: p.cut ?? 0,
  xray: p.xray ?? 0,
  elec: p.elec ?? 0,
  plumb: p.plumb ?? 0,
  spr: p.spr ?? 0.4,
  ring: p.ring ?? 0.1,
  paint: p.paint ?? 0,
  fx: p.fx ?? 0,
  fy: p.fy ?? 0,
});
const STATES = POSES.map(base);
const KEYS = Object.keys(STATES[0]) as (keyof State)[];

/** Ease between neighbouring poses; a short hold at each so the camera settles on what you read. */
function glide(t: number) {
  const a = Math.min(1, Math.max(0, (t - 0.16) / 0.68));
  return a * a * a * (a * (a * 6 - 15) + 10);
}

export function sample(f: number): State {
  const n = POSES.length - 1;
  const c = Math.min(n, Math.max(0, f));
  const i = Math.min(n - 1, Math.floor(c));
  const t = glide(c - i);
  const a = STATES[i];
  const b = STATES[i + 1];
  const out = {} as State;
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

export function eased(f: number) {
  const n = POSES.length - 1;
  const c = Math.min(n, Math.max(0, f));
  const i = Math.min(n - 1, Math.floor(c));
  return i + glide(c - i);
}

/** 0..1: how much pose i is "the current one" at eased position e. */
export const weight = (e: number, i: number) => Math.max(0, 1 - Math.abs(e - i) * 1.7);

/** Position of each service's pose in POSES. */
export const POSE_INDEX: Record<string, number> = {};
POSES.forEach((p, i) => {
  if (p.slug) POSE_INDEX[p.slug] = i;
});
