// The house starts almost colourless: everything is softened towards a pale neutral,
// so that only the part being talked about pops into full colour.
import { Color } from 'three';

const hsl = { h: 0, s: 0, l: 0 };
export function mute(c: Color, amount = 0.88) {
  c.getHSL(hsl);
  return new Color().setHSL(hsl.h, hsl.s * (1 - amount), Math.min(0.96, hsl.l * 0.9 + 0.08));
}
