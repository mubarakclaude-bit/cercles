// Guides: long answers to the questions people search before they call.
// Each guide links to the service it belongs to, and the service page links back.
import type { Section } from './curtains';

export interface Guide {
  slug: string;
  title: string; // Google title (brand is added after it)
  h1: string;
  description: string;
  label: string;
  service: string; // service slug it leads to
  published: string; // YYYY-MM-DD
  updated: string;
  answer: string; // the short answer at the top
  sections: Section[];
  faqs: { q: string; a: string }[];
  links: { href: string; label: string }[]; // pages in the same cluster
}

export const GUIDES: Guide[] = [
  {
    slug: 'curtains-and-blinds-kerala',
    title: 'Curtains & Blinds for Kerala Homes: A Buying Guide',
    h1: 'How to choose curtains and blinds for a Kerala home',
    label: 'Curtains and blinds guide',
    description:
      'Curtain styles, fabrics, blinds, blackout, motorised tracks and measuring, explained for Kerala’s sun, monsoon and humidity. A plain guide from Cercles, Kozhikode.',
    service: 'curtains',
    published: '2026-11-28',
    updated: '2026-11-28',
    answer:
      'Use curtains where you want softness, warmth and full darkness (living rooms and bedrooms) and blinds where space and easy cleaning matter (kitchens, studies, offices). In Kerala, choose fabrics that resist fading and mould, rust-free tracks, a lining for sunny windows, and always measure wider and higher than the window itself.',
    sections: [
      {
        h: 'Curtains or blinds?',
        p: [
          'Both cover a window; they just do it differently. <strong>Curtains</strong> hang from a track or rod above the window and cover part of the wall too. They feel softer, block more light and sound, and make a room look finished. <strong>Blinds</strong> sit close to the glass, take almost no space and are easy to wipe clean.',
          'A simple rule many homes follow: curtains in the living room and bedrooms, blinds in the kitchen, study, bathrooms and office. Wide glass and sliding doors can take either.',
        ],
      },
      {
        h: 'Curtain styles, explained simply',
        cards: [
          { art: 'pleated', t: 'Pleated', d: 'Fabric stitched into neat folds at the top. Classic and tailored.' },
          { art: 'ripple', t: 'Ripple fold', d: 'Soft, even waves on a special track. Modern and calm.' },
          { art: 'eyelet', t: 'Eyelet', d: 'Rings in the fabric slide onto a rod. Simple and easy to wash.' },
          { art: 'roman', t: 'Roman', d: 'Folds up in layers: a curtain’s look in a blind’s space.' },
        ],
        after: [
          'The style decides how much fabric you need. Ripple fold and pleated curtains usually need about two to two and a half times the width of the window in fabric, so they look full rather than flat.',
        ],
      },
      {
        h: 'Fabric layers: sheer, day and blackout',
        p: [
          'Most rooms work best with two layers on a double track. A <strong>sheer</strong> (thin, see-through fabric) in front softens the light and gives privacy during the day. A <strong>main or blackout curtain</strong> behind it closes for the night.',
          'A <strong>lining</strong> stitched behind the main fabric does three jobs: it blocks more light, keeps heat out and protects the fabric from fading in the sun. For west-facing windows in Kerala, a lining is usually worth it. If you want a fully dark bedroom, choose blackout fabric or a blackout lining; see <a href="/kozhikode/blackout-curtains/">blackout curtains</a>.',
        ],
        figure: { art: 'layers', caption: 'Two tracks: a sheer in front for the day, a main or blackout curtain behind for the night.', small: true },
      },
      {
        h: 'Types of blinds',
        cards: [
          { art: 'roller', t: 'Roller', d: 'One flat panel that rolls up. Clean and practical.' },
          { art: 'zebra', t: 'Zebra', d: 'Sheer and solid stripes line up for light or privacy.' },
          { art: 'vertical', t: 'Vertical', d: 'Tall slats for wide windows and sliding doors.' },
          { art: 'venetian', t: 'Wooden', d: 'Horizontal slats that tilt to control light.' },
          { art: 'roman', t: 'Roman', d: 'Soft fabric folds, the most curtain-like blind.' },
        ],
        after: ['Our <a href="/kozhikode/window-blinds/">window blinds page</a> explains which type suits which room.'],
      },
      {
        h: 'What Kerala weather does to curtains',
        p: [
          'Three things decide how long curtains last here: <strong>sun, humidity and salt air</strong>.',
        ],
        list: [
          '<strong>Sun</strong>: strong afternoon light fades bright colours, especially on west-facing glass. Choose fade-resistant fabric or add a lining.',
          '<strong>Monsoon humidity</strong>: months of damp air can cause mould spots and a musty smell. Synthetic and blended fabrics handle damp better than pure cotton or silk, and curtains should hang a little away from the glass so air can move.',
          '<strong>Salt air near the coast</strong>: in coastal areas such as Kozhikode, cheap steel rods and brackets rust and stain the fabric. Aluminium tracks and good-quality fittings avoid this.',
        ],
        after: [
          'In the monsoon, open curtains on dry days, run a fan in closed rooms and wash or dry-clean heavy curtains before the rain starts.',
        ],
      },
      {
        h: 'How to measure for curtains',
        p: [
          'Measuring is where most curtain problems begin. The window frame is not the size of the curtain:',
        ],
        figure: { art: 'measure', caption: 'Measure the track, not the window: wider, higher, and close to the floor.' },
        list: [
          '<strong>Width</strong>: the track or rod should run about 15 to 30 cm beyond the window on each side, so the open curtains do not cover the glass.',
          '<strong>Height</strong>: fix the track well above the window, often close to the ceiling. Rooms look taller and less light leaks over the top.',
          '<strong>Length</strong>: decide whether the curtain should just touch the floor, float a little above it, or stop at the sill. In Kerala homes with floor mopping, a curtain that ends just above the floor stays cleaner.',
          '<strong>Fullness</strong>: multiply the track width by the fullness of the style (about two to two and a half times for pleated and ripple fold) to get the fabric width.',
        ],
        after: [
          'This is why we always measure at your home before quoting. Walls are not always straight, ceilings vary and grills or AC units change where a track can go.',
        ],
      },
      {
        h: 'Rods, tracks and motors',
        p: [
          '<strong>Rods</strong> are visible and decorative, and suit eyelet curtains. <strong>Tracks</strong> hide behind the curtain or in the ceiling, run more smoothly and are needed for ripple fold curtains. For heavy, double-layer or very wide curtains, a strong track and the right brackets matter more than the fabric.',
          'A <strong>motorised track</strong> opens and closes the curtains from a remote, a phone or a schedule. It needs a power point near the top of the window, which is easiest to plan before painting or during a renovation. See <a href="/kozhikode/motorised-curtains/">motorised curtains</a>.',
        ],
        figure: { art: 'motorised', caption: 'A motor at the end of the track, controlled from a remote, a phone or a schedule.', small: true },
      },
      {
        h: 'What decides the price',
        p: ['Two windows of the same size can cost very different amounts. The main things that change the price are:'],
        list: [
          '<strong>The fabric</strong> you choose, and whether it is imported or local.',
          '<strong>The style and fullness</strong>: ripple fold and pleated styles use more fabric than eyelet.',
          '<strong>Lining or blackout</strong> behind the main fabric.',
          '<strong>Number of layers</strong>: a sheer plus a main curtain on a double track.',
          '<strong>The track or rod</strong>, and whether it is motorised.',
          '<strong>The size of the window</strong> and the height of the ceiling.',
        ],
        after: [
          'The honest way to get a price is a site visit: we measure, show you fabrics in your budget and give you one clear quotation for every window.',
        ],
      },
      {
        h: 'Mistakes to avoid',
        list: [
          'Buying fabric by the window size and ending up with flat, skimpy curtains.',
          'Hanging the rod just above the frame, which makes the room look low and lets light in.',
          'Using steel fittings near the coast that rust within a monsoon or two.',
          'Choosing delicate fabric for a window that gets full afternoon sun.',
          'Planning a motorised curtain after the walls are painted, with no power point.',
          'Skipping the sheer layer, so the room is either exposed or dark.',
        ],
      },
    ],
    faqs: [
      { q: 'Which curtain fabric is best for Kerala?', a: 'Polyester and polyester blends handle humidity, resist fading and are easy to wash, which makes them the practical choice for most Kerala rooms. Linen and cotton look lovely but need more care in the monsoon.' },
      { q: 'How much fabric do I need for one window?', a: 'For pleated or ripple fold curtains, roughly two to two and a half times the track width. The track itself should be wider than the window. A site measurement gives the exact figure.' },
      { q: 'Are blinds cheaper than curtains?', a: 'Often, for small windows, because they use less fabric and no fullness. For large windows it depends on the type and fabric. A quotation for both lets you compare.' },
      { q: 'Should curtains touch the floor?', a: 'Full-length curtains look best. Many Kerala homes prefer them to stop just above the floor so they stay clean when the floor is mopped.' },
      { q: 'How often should curtains be washed?', a: 'Sheers every few months, heavier curtains once or twice a year, ideally before the monsoon. Always follow the care advice for the fabric.' },
      { q: 'Do you measure and fit curtains in Kozhikode?', a: 'Yes. Cercles offers a free site visit anywhere in Kozhikode (Calicut): we measure, help you choose and fit the curtains or blinds ourselves.' },
    ],
    links: [
      { href: '/services/curtains/', label: 'Curtain works' },
      { href: '/kozhikode/window-blinds/', label: 'Window blinds' },
      { href: '/kozhikode/motorised-curtains/', label: 'Motorised curtains' },
      { href: '/kozhikode/blackout-curtains/', label: 'Blackout curtains' },
      { href: '/kozhikode/office-blinds/', label: 'Office blinds' },
    ],
  },
];

export const GUIDE_BY_SLUG = Object.fromEntries(GUIDES.map((g) => [g.slug, g])) as Record<string, Guide>;
export const guidesFor = (service: string) => GUIDES.filter((g) => g.service === service);
