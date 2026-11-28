// The curtain cluster: one page per thing people in Kozhikode search for about curtains and blinds.
// Each page is reached from the curtain service page ("Popular in Kozhikode"), the footer and the guide.
// No prices are written anywhere until the owner gives real ranges.

export interface Section {
  h: string;
  p?: string[];
  list?: string[];
  /** drawing cards: art name from src/lib/art.ts, title, one line, optional link */
  cards?: { art: string; t: string; d: string; href?: string }[];
  /** one larger drawing with a caption */
  figure?: { art: string; caption: string; small?: boolean };
  after?: string[];
}

const GUIDE = '/guides/curtains-and-blinds-kerala/';

export const CURTAIN_LANDINGS = [
  {
    slug: 'window-blinds',
    art: 'zebra',
    title: 'Window Blinds in Kozhikode (Calicut)',
    h1: 'Window blinds in Kozhikode, measured and fitted',
    label: 'Window blinds',
    description:
      'Window blinds in Kozhikode (Calicut): roller, zebra, Roman, vertical and wooden blinds, measured at your home and fitted by our own team.',
    pose: 'curtains',
    intro:
      'Blinds are the neat, low-fuss answer for kitchens, study rooms, offices and wide glass. Cercles measures every window at your home in Kozhikode, helps you pick the right type and fabric, and fits the blinds so they sit straight and run smoothly.',
    offer: [
      'Site visit and exact measurement of every window',
      'Roller and zebra (day and night) blinds',
      'Roman blinds in fabric of your choice',
      'Vertical blinds for wide windows and sliding doors',
      'Wooden and venetian-style blinds',
      'Manual, chain or motorised operation',
    ],
    local:
      'Kozhikode windows take strong west sun in the afternoon and months of monsoon damp. We suggest fabrics and finishes that do not fade quickly or hold mould, and fittings that will not rust near the coast.',
    sections: [
      {
        h: 'Which blind suits which room',
        cards: [
          { art: 'roller', t: 'Roller', d: 'One smooth panel that rolls up. Easy to wipe; kitchens, studies, offices.' },
          { art: 'zebra', t: 'Zebra', d: 'Sheer and solid stripes: soft light or privacy with one cord.' },
          { art: 'roman', t: 'Roman', d: 'Fabric that folds up in layers. The look of a curtain, the space of a blind.' },
          { art: 'vertical', t: 'Vertical', d: 'Tall slats that turn and slide. Wide windows and sliding doors.' },
          { art: 'venetian', t: 'Wooden', d: 'Slats that tilt to control light. A warm look, in humidity-ready finishes.' },
        ],
      },
      {
        h: 'Blinds or curtains?',
        p: [
          'Blinds sit close to the glass, take very little space and are easy to clean, so they work well where curtains would get in the way: above a kitchen counter, behind a desk or on a window with furniture in front of it.',
          'Curtains are softer, cover more of the wall and block more sound and light. Many homes use both: blinds in the kitchen and study, curtains in the living room and bedrooms. Our <a href="' + GUIDE + '">curtains and blinds guide</a> explains the choice in more detail.',
        ],
      },
      {
        h: 'How we measure and fit',
        p: [
          'A blind only looks right when it is measured to the millimetre. We check whether it should sit inside the window frame or outside it, how deep the frame is, where the handles and grills are, and whether the wall can hold the brackets.',
          'After you choose the fabric and type, we make the blinds to size and come back to fit them, test every one, and show you how to use and clean them.',
        ],
      },
    ] as Section[],
    faqs: [
      { q: 'Which blinds are best for Kerala weather?', a: 'Roller and zebra blinds in polyester or PVC-coated fabric handle humidity well and are easy to wipe. For wood looks, we suggest finishes made for damp climates so the slats do not warp.' },
      { q: 'Do you come home to measure?', a: 'Yes. A free site visit anywhere in Kozhikode is the first step. We measure every window and then give you one clear quotation.' },
      { q: 'Can blinds be motorised?', a: 'Yes. Roller, zebra and Roman blinds can run on a motor with a remote, a phone or a schedule. See motorised curtains for how it works.' },
      { q: 'Are blinds good for offices and shops?', a: 'Yes. Roller and vertical blinds are a common choice for offices because they are neat, cut glare on screens and are easy to maintain.' },
      { q: 'How do I clean blinds?', a: 'Most roller and zebra blinds only need dusting and a wipe with a damp cloth. We explain the care for your chosen fabric when we fit them.' },
    ],
    related: ['curtains', 'interior-works', 'electrical'],
  },
  {
    slug: 'motorised-curtains',
    art: 'motorised',
    title: 'Motorised Curtains & Blinds in Kozhikode',
    h1: 'Motorised curtains and blinds in Kozhikode',
    label: 'Motorised curtains',
    description:
      'Motorised curtains and blinds in Kozhikode (Calicut): open and close from a remote, your phone or a schedule. Track, motor, wiring and fitting by one team.',
    pose: 'curtains',
    intro:
      'With a motor, curtains open in the morning on their own, close when the sun hits the glass and can be controlled from a remote or your phone. Cercles plans the track, motor and power point with your curtains in Kozhikode, so it is neat, quiet and reliable.',
    offer: [
      'Motorised tracks for pleated and ripple fold curtains',
      'Motorised roller, zebra and Roman blinds',
      'Control by remote, wall switch, phone app or schedule',
      'Power point placed and wired by our electrical team',
      'Tracks sized for heavy and double-layer curtains',
      'Set-up, testing and a walkthrough at handover',
    ],
    local:
      'Power cuts and voltage changes are common in Kerala. We plan protection for the motor and choose systems where the curtain can still be pulled by hand when the power is off.',
    sections: [
      {
        h: 'Where motorised curtains make sense',
        list: [
          '<strong>Tall and wide windows</strong>, where pulling heavy curtains by hand is a daily struggle.',
          '<strong>Double layers</strong> (sheer and blackout) that you open and close several times a day.',
          '<strong>Bedrooms</strong>, so the curtains open slowly at the time you wake up.',
          '<strong>Rooms that get strong afternoon sun</strong>, where a schedule closes the curtains before the room heats up.',
          '<strong>Homes where owners travel</strong>, so the house looks lived in.',
        ],
      },
      {
        h: 'Plan it with the wiring',
        p: [
          'A motor needs a power point near the top of the window. In a new home or a renovation, our electrical team places that point before the walls are finished, so no wire shows. In a finished home we find the neatest route and tell you before we start.',
          'Motorised curtains can also be part of wider <a href="/kozhikode/home-automation/">home automation</a>, with lighting scenes and other smart features controlled from one app.',
        ],
      },
      {
        h: 'What a motorised system includes',
        p: [
          'Each window gets a track sized for the weight of its curtains, a motor at one end, and a way to control it: a remote, a wall switch, a phone app, or all three. We hang the curtains, set the open and closed positions and test it with you before we leave.',
        ],
        cards: [
          { art: 'ripple', t: 'Motorised curtains', d: 'Ripple fold or pleated curtains on a motorised track.' },
          { art: 'roller', t: 'Motorised blinds', d: 'Roller, zebra and Roman blinds that rise and fall on a motor.' },
          { art: 'motorised', t: 'Phone, remote, schedule', d: 'Open at sunrise, close in the afternoon sun, or tap your phone.' },
        ],
      },
    ] as Section[],
    faqs: [
      { q: 'Can my existing curtains be motorised?', a: 'Often yes. The curtains usually stay; the rod or track is replaced with a motorised track. A site visit tells us what is practical for your windows.' },
      { q: 'What happens during a power cut?', a: 'We choose systems where the curtain can still be pulled by hand, and we can plan the motor on a backed-up circuit if you have an inverter.' },
      { q: 'Can I control the curtains from my phone?', a: 'Yes, with a smart motor. You can also set schedules and use a remote or wall switch.' },
      { q: 'Are motors noisy?', a: 'Good curtain motors are quiet. We fit and adjust them so they run smoothly without jerks.' },
      { q: 'Can blinds be motorised too?', a: 'Yes. Roller, zebra and Roman blinds can all run on motors.' },
    ],
    related: ['curtains', 'electrical', 'interior-works'],
  },
  {
    slug: 'blackout-curtains',
    art: 'blackout',
    title: 'Blackout Curtains in Kozhikode',
    h1: 'Blackout curtains in Kozhikode, for darker, cooler rooms',
    label: 'Blackout curtains',
    description:
      'Blackout curtains in Kozhikode (Calicut) for bedrooms, home theatres and sunny rooms: made to measure, lined, and fitted to block light and heat.',
    pose: 'curtains',
    intro:
      'A blackout curtain keeps a bedroom dark for good sleep, cuts glare on a TV and keeps afternoon heat out of the room. Cercles makes blackout curtains to measure in Kozhikode, often as a second layer behind a sheer, and fits them so light does not leak around the edges.',
    offer: [
      'Blackout fabric or blackout lining behind your chosen fabric',
      'Sheer and blackout double layers on one track',
      'Curtains made wider and longer than the window to stop light leaks',
      'Pleated, ripple fold and eyelet styles',
      'Blackout Roman and roller blinds',
      'Manual or motorised operation',
    ],
    local:
      'West-facing rooms in Kozhikode get hot by late afternoon. A lined blackout curtain blocks much of that heat at the glass, and a sheer layer in front keeps the room bright and private by day.',
    sections: [
      {
        h: 'Blackout fabric or blackout lining?',
        p: [
          '<strong>Blackout fabric</strong> has the light-blocking layer woven or coated into it. It is one layer, simple and effective.',
          '<strong>Blackout lining</strong> is stitched behind the fabric you like, so you can choose any colour or texture for the room and still get a dark room. Lining also protects the main fabric from sun fading.',
        ],
        cards: [
          { art: 'blackout', t: 'Blackout', d: 'Dark, lined fabric for sleep, screens and heat.' },
          { art: 'layers', t: 'Sheer + blackout', d: 'Soft daylight in front, full dark behind, on a double track.' },
        ],
      },
      {
        h: 'Stopping light at the edges',
        p: [
          'Even the best fabric lets light in if the curtain is too narrow or hung too low. We place the track above the window and wider than it, give the curtain enough fullness to overlap in the middle, and set the length close to the floor. For the darkest rooms, a ceiling track or a pelmet stops light spilling over the top.',
        ],
        figure: { art: 'measure', caption: 'Track wider and higher than the window, curtain close to the floor: no light leaks.' },
      },
      {
        h: 'Which rooms need blackout',
        list: [
          '<strong>Bedrooms</strong>, especially for children, shift workers and anyone who sleeps in the afternoon.',
          '<strong>Home theatres and TV rooms</strong>, to remove glare from the screen.',
          '<strong>West-facing rooms</strong>, to keep the afternoon heat out.',
          '<strong>Nurseries and guest rooms</strong> facing street lights.',
        ],
        after: [
          'Not sure what you need for each room? Read our <a href="' + GUIDE + '">guide to curtains and blinds for Kerala homes</a>.',
        ],
      },
    ] as Section[],
    faqs: [
      { q: 'Do blackout curtains really keep the room cooler?', a: 'They help. A lined curtain stops much of the sun’s heat at the window, which matters most in west-facing rooms in the afternoon.' },
      { q: 'Can I have a light curtain in the day and blackout at night?', a: 'Yes. A double track holds a sheer in front and a blackout layer behind, and each opens on its own.' },
      { q: 'Will blackout curtains get mouldy in the monsoon?', a: 'Not if they are chosen and hung well. We suggest fabrics and linings that handle humidity and leave a small gap from the glass for air.' },
      { q: 'Can blackout be added to my existing curtains?', a: 'Often yes, by adding a blackout lining or a second blackout layer on a double track.' },
      { q: 'Do you make blackout blinds as well?', a: 'Yes. Roller and Roman blinds come in blackout fabric, which suits kitchens, studies and smaller windows.' },
    ],
    related: ['curtains', 'interior-works', 'painting-texturing'],
  },
  {
    slug: 'office-blinds',
    art: 'office',
    title: 'Office Blinds & Curtains in Kozhikode',
    h1: 'Office blinds and curtains in Kozhikode',
    label: 'Office blinds',
    description:
      'Office blinds and curtains in Kozhikode (Calicut) for offices, clinics, shops and showrooms: roller, vertical and zebra blinds, measured and fitted.',
    pose: 'curtains',
    intro:
      'An office needs light without glare on screens, privacy for meeting rooms and something that is easy to keep clean. Cercles supplies and fits blinds and curtains for offices, clinics, shops and showrooms in Kozhikode, measured on site and fitted with minimum disturbance to your work.',
    offer: [
      'Roller blinds for workstations and cabins',
      'Vertical blinds for wide glass and partitions',
      'Zebra blinds for reception and meeting rooms',
      'Blackout blinds for conference and training rooms',
      'Curtains for clinics, waiting areas and showrooms',
      'Fitting planned around your working hours',
    ],
    local:
      'Many offices in Kozhikode have large glass fronts that turn into a heat trap in the afternoon. The right blind cuts glare and heat while keeping the space bright.',
    sections: [
      {
        h: 'What works in a workplace',
        cards: [
          { art: 'roller', t: 'Roller', d: 'A clean, uniform look across many windows; cuts screen glare.' },
          { art: 'vertical', t: 'Vertical', d: 'Wide glass and partitions; slats turn for light without a view in.' },
          { art: 'zebra', t: 'Zebra', d: 'A softer, modern look for reception areas and cabins.' },
          { art: 'blackout', t: 'Blackout', d: 'Meeting rooms where projectors and screens must be clear.' },
        ],
      },
      {
        h: 'Fitting without stopping your work',
        p: [
          'We measure every window in one visit, give one quotation for the whole space, and plan fitting room by room or after hours, so your office keeps running.',
          'If you are fitting out a new office, blinds can be planned with the <a href="/services/interior-works/">interior work</a>, <a href="/services/electrical/">electrical points</a> and <a href="/services/aluminium-fabrication/">aluminium partitions</a> under one schedule.',
        ],
      },
    ] as Section[],
    faqs: [
      { q: 'Do you handle large offices with many windows?', a: 'Yes. We measure every window in one visit and give one quotation for the whole space.' },
      { q: 'Can you fit blinds outside office hours?', a: 'Yes. Tell us your working hours and we will plan fitting around them.' },
      { q: 'Which blinds are easiest to maintain?', a: 'Roller and vertical blinds in wipeable fabric are the easiest to keep clean in a busy office.' },
      { q: 'Do you also do shops and clinics?', a: 'Yes. We fit blinds and curtains for shops, clinics, showrooms and other small commercial spaces.' },
    ],
    related: ['curtains', 'interior-works', 'aluminium-fabrication'],
  },
];
