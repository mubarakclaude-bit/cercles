// Single source of truth for the whole site: business facts, services, areas.
// Pages, navigation, sitemap and structured data all read from here.

export const SITE = {
  name: 'Cercles',
  brand: 'Cercles Full-Circle Living',
  url: 'https://cercles.in',
  tagline: 'Roof to Garden. One Call.',
  phone: '+91 75599 42708',
  phoneRaw: '+917559942708',
  whatsapp: '917559942708',
  email: 'connect@cercles.in',
  instagram: 'https://www.instagram.com/cercles.in/',
  // Fill these in when known. Structured data only includes what is set.
  address: null as null | {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
  },
  geo: null as null | { lat: number; lng: number },
  foundingYear: null as null | number,
  mapUrl: null as null | string,
  description:
    'Cercles is a one-stop home solutions company in Kerala. Interiors, curtains, electrical, plumbing, roofing, facades, aluminium work, landscaping and irrigation under one quotation, one schedule and one accountable team.',
} as const;

export type CategoryId = 'interiors' | 'utilities' | 'exteriors' | 'outdoors';

export const CATEGORIES: {
  id: CategoryId;
  name: string;
  short: string;
  blurb: string;
}[] = [
  {
    id: 'interiors',
    name: 'Interiors & Soft Furnishings',
    short: 'Interiors',
    blurb: 'Curtains, sofas, furniture, painting and complete interior fit-outs, made to measure.',
  },
  {
    id: 'utilities',
    name: 'Electrical & Plumbing',
    short: 'Electrical & Plumbing',
    blurb: 'Lighting design, wiring, new plumbing, repairs and upgrades, done end to end.',
  },
  {
    id: 'exteriors',
    name: 'Exteriors & Building Envelope',
    short: 'Exteriors',
    blurb: 'Roofing, waterproofing, ACP facades, aluminium work and rainwater gutters.',
  },
  {
    id: 'outdoors',
    name: 'Outdoors & Landscaping',
    short: 'Outdoors',
    blurb: 'Gardens, paving and automated irrigation for the space at your gate.',
  },
];

export interface Service {
  slug: string;
  name: string;
  category: CategoryId;
  /** Short label used in cards and menus */
  label: string;
  /** Search-led page title (without brand suffix) */
  title: string;
  /** Meta description, 120-155 characters */
  description: string;
  /** One-sentence summary for cards */
  summary: string;
  intro: string;
  includes: string[];
  keralaNote: string;
  idealFor: string[];
  faqs: { q: string; a: string }[];
  /** Slugs of services commonly combined with this one */
  related: string[];
  icon: string;
}

export const SERVICES: Service[] = [
  {
    slug: 'curtains',
    name: 'Curtain Works',
    label: 'Curtains',
    category: 'interiors',
    title: 'Curtains & Motorised Curtains in Kerala',
    description:
      'Made-to-measure curtains, blinds and motorised, automated curtains across Kerala. Site measurement, clear quotation, neat installation.',
    summary: 'Made-to-measure curtains, blinds and motorised automation.',
    intro:
      'Curtains change how a room feels more than almost anything else, and they only work when they are measured, stitched and hung properly. Cercles handles the full job: site measurement, fabric guidance, stitching and installation, including motorised curtains that open and close from a phone, a remote or a schedule.',
    includes: [
      'Site visit and accurate window measurement',
      'Pleated, ripple fold, eyelet and Roman styles',
      'Day, sheer and blackout layers',
      'Motorised and automated curtain tracks',
      'Rods, tracks and brackets matched to the wall and load',
      'Installation, finishing and a final check',
    ],
    keralaNote:
      'Kerala homes deal with strong afternoon sun, monsoon humidity and a lot of glass. We help you pick fabrics that resist fading and mildew, and tracks that will not rust.',
    idealFor: ['New villas and apartments', 'Home upgrades', 'Offices and small shops'],
    faqs: [
      {
        q: 'Do you take measurements at my home?',
        a: 'Yes. A site visit is the first step. We measure every window, check the wall and ceiling, and then give you one clear quotation.',
      },
      {
        q: 'Can curtains be motorised and automated?',
        a: 'Yes. Motorised curtains can be controlled from a phone or remote and set on a schedule. They can also be planned together with lighting so the whole room works as one system.',
      },
      {
        q: 'Can I book curtains on their own, without a full project?',
        a: 'Yes. Every Cercles service can be booked individually or combined into one complete project.',
      },
    ],
    related: ['interior-works', 'electrical', 'painting-texturing'],
    icon: 'curtain',
  },
  {
    slug: 'sofa-making',
    name: 'Sofa Making',
    label: 'Sofas',
    category: 'interiors',
    title: 'Custom Sofa Making in Kerala',
    description:
      'Custom-built sofas made to your space and taste across Kerala. Choose size, frame, foam and fabric. Clear quotation and delivery on schedule.',
    summary: 'Custom-built sofas, sized to your room and your taste.',
    intro:
      'A ready-made sofa rarely fits the room it lands in. Cercles builds sofas to your space: the right size for the wall, the right seat depth for the way you sit, and a frame, foam and fabric you have actually chosen.',
    includes: [
      'Design to the available space',
      'Frame, foam density and upholstery options',
      'L-shape, sectional, 3-seater, recliner and accent pieces',
      'Fabric and finish selection',
      'Delivery and placement at your home',
      'Re-upholstery of existing sofas',
    ],
    keralaNote:
      'Humidity is hard on foam and fabric. We recommend frames and finishes that cope with Kerala weather, and fabrics that are easy to keep fresh.',
    idealFor: ['Living rooms', 'Villas and apartments', 'Offices and reception areas'],
    faqs: [
      {
        q: 'Can you copy a sofa I have seen somewhere?',
        a: 'Share a photo or a reference and we will tell you honestly what can be matched and what the difference in size, foam and fabric will be.',
      },
      {
        q: 'Do you repair or re-upholster existing sofas?',
        a: 'Yes. Re-upholstery is part of the sofa service and often costs far less than replacing the sofa.',
      },
    ],
    related: ['curtains', 'furniture-works', 'interior-works'],
    icon: 'sofa',
  },
  {
    slug: 'interior-works',
    name: 'Interior Works',
    label: 'Interior fit-out',
    category: 'interiors',
    title: 'Complete Interior Design & Fit-Out in Kerala',
    description:
      'Full home interior fit-out and finishing in Kerala: false ceilings, wardrobes, kitchens, panelling and more under one quotation.',
    summary: 'Full interior fit-out and finishing, one plan across every trade.',
    intro:
      'A full interior is many trades that must arrive in the right order. Cercles runs the whole fit-out under one plan: carpentry, ceilings, electrical points, paint and finishing, with a single project lead so you are not chasing five different people.',
    includes: [
      'Space planning and layout',
      'False ceilings and wall panelling',
      'Wardrobes, kitchens and storage',
      'Electrical and plumbing coordinated with the design',
      'Painting, texturing and final finishing',
      'Quality check before handover',
    ],
    keralaNote:
      'Material choices matter in a humid, high-rainfall state. We favour finishes and board grades that hold up, and we plan ventilation and moisture protection from day one.',
    idealFor: ['New villas and apartments', 'Renovations', 'Landlords and investors'],
    faqs: [
      {
        q: 'Will I get one quotation for the whole interior?',
        a: 'Yes. A full interior is quoted as one scope, one schedule and one price, so there are no surprises between trades.',
      },
      {
        q: 'Can you work around a design from my architect?',
        a: 'Yes. We can execute an existing design or help develop one, depending on what you need.',
      },
    ],
    related: ['furniture-works', 'painting-texturing', 'electrical', 'curtains'],
    icon: 'interior',
  },
  {
    slug: 'furniture-works',
    name: 'Furniture Works',
    label: 'Furniture',
    category: 'interiors',
    title: 'Made-to-Measure Furniture in Kerala',
    description:
      'Made-to-measure furniture for homes and offices in Kerala: wardrobes, TV units, beds, dining and storage, built to your space.',
    summary: 'Made-to-measure wardrobes, units, beds and storage.',
    intro:
      'Built-in and made-to-measure furniture uses every inch of a room properly. Cercles designs and builds furniture to your dimensions, with materials and finishes chosen for how you live.',
    includes: [
      'Wardrobes and storage',
      'TV units and display walls',
      'Beds, study tables and dining sets',
      'Material and finish options',
      'Hardware and fittings selection',
      'Installation and finishing at site',
    ],
    keralaNote:
      'Moisture is the enemy of furniture in Kerala. We specify board grades, edge sealing and finishes suited to humid conditions.',
    idealFor: ['Bedrooms and living rooms', 'Villas and apartments', 'Small offices'],
    faqs: [
      {
        q: 'Do you make single pieces or only full sets?',
        a: 'Both. A single wardrobe is as welcome as a full-house furniture package.',
      },
    ],
    related: ['interior-works', 'sofa-making', 'painting-texturing'],
    icon: 'furniture',
  },
  {
    slug: 'painting-texturing',
    name: 'Painting & Texturing',
    label: 'Painting',
    category: 'interiors',
    title: 'Painting & Decorative Texturing in Kerala',
    description:
      'Interior and exterior painting and decorative textures in Kerala. Proper surface preparation, clean finishes, clear quotation.',
    summary: 'Clean finishes and decorative textures, properly prepared.',
    intro:
      'Paint only looks good over a well-prepared surface. Cercles handles preparation, putty, primer and finish coats for clean results, and offers decorative textures where you want a wall to be a feature.',
    includes: [
      'Surface inspection and preparation',
      'Putty, primer and finish coats',
      'Interior and exterior painting',
      'Decorative and textured finishes',
      'Damp and crack treatment before painting',
      'Cleanup and final check',
    ],
    keralaNote:
      'Monsoon damp and algae cause peeling and stains. We treat the surface first and recommend coatings suited to heavy rain, so the finish lasts.',
    idealFor: ['Home renovations', 'New construction', 'Shops and offices'],
    faqs: [
      {
        q: 'Do you fix damp patches before painting?',
        a: 'Yes. Painting over damp only hides the problem for a season, so we identify and treat the cause first.',
      },
    ],
    related: ['interior-works', 'roofing', 'acp-facade'],
    icon: 'paint',
  },
  {
    slug: 'electrical',
    name: 'Electrical Works',
    label: 'Electrical',
    category: 'utilities',
    title: 'Electrical Works & Lighting Design in Kerala',
    description:
      'End-to-end electrical work in Kerala: wiring, lighting design, installation, upgrades and smart lighting for homes and small commercial spaces.',
    summary: 'Wiring, lighting design and installation, end to end.',
    intro:
      'Good lighting and safe wiring are planned before the walls are finished. Cercles takes care of electrical work from layout through installation, including lighting design that suits each room and, if you want it, automation.',
    includes: [
      'Wiring layout and installation',
      'Lighting design and fixtures',
      'Switches, DB and safety systems',
      'Upgrades and rewiring',
      'Smart and automated lighting',
      'Testing and handover',
    ],
    keralaNote:
      'Heavy rain, lightning and humidity make safe earthing and protection important. We plan these as part of the job, not as an afterthought.',
    idealFor: ['New homes', 'Renovations', 'Shops and offices'],
    faqs: [
      {
        q: 'Can electrical work be planned with my interiors?',
        a: 'Yes, and it should be. Points, lights and switches placed to match furniture and curtains give a much better result than fixing them later.',
      },
    ],
    related: ['interior-works', 'curtains', 'irrigation'],
    icon: 'bolt',
  },
  {
    slug: 'plumbing',
    name: 'Plumbing Works',
    label: 'Plumbing',
    category: 'utilities',
    title: 'Plumbing Works in Kerala',
    description:
      'New plumbing installation, repairs and upgrades for homes in Kerala. Leak fixing, bathroom and kitchen plumbing, tidy workmanship.',
    summary: 'New installations, repairs and upgrades, done tidily.',
    intro:
      'Plumbing problems get expensive when they are hidden behind finished walls. Cercles installs, repairs and upgrades plumbing with care for pressure, drainage and access, so the system works and can be maintained.',
    includes: [
      'New installations for homes',
      'Bathroom and kitchen plumbing',
      'Leak detection and repair',
      'Pipe and fitting upgrades',
      'Water storage and supply planning',
      'Testing before closing walls',
    ],
    keralaNote:
      'Kerala homes rely on wells, borewells and storage tanks as much as mains supply. We plan the system around how your water actually arrives.',
    idealFor: ['New homes', 'Bathroom renovations', 'Repair and upgrade jobs'],
    faqs: [
      {
        q: 'Do you handle small repair jobs?',
        a: 'Yes. Any single service can be booked on its own, with the same standards as a larger project.',
      },
    ],
    related: ['interior-works', 'roofing', 'irrigation'],
    icon: 'drop',
  },
  {
    slug: 'roofing',
    name: 'Roofing & Waterproofing',
    label: 'Roofing',
    category: 'exteriors',
    title: 'Roofing, Repairs & Waterproofing in Kerala',
    description:
      'New roofs, roof repairs and waterproofing in Kerala, built for heavy monsoon rain. Inspection, clear scope and quality-checked work.',
    summary: 'New roofs, repairs and waterproofing built for the monsoon.',
    intro:
      'In Kerala a roof is tested every year by months of heavy rain. Cercles installs and repairs roofs and treats terraces and slabs against leaks, with the drainage, slope and joints planned properly.',
    includes: [
      'Roof inspection and leak diagnosis',
      'New roofing systems',
      'Roof repairs and replacement',
      'Terrace and slab waterproofing',
      'Drainage and slope correction',
      'Rainwater gutters, if needed',
    ],
    keralaNote:
      'Most leaks start at joints, junctions and drainage points, not in the middle of the surface. We look there first.',
    idealFor: ['Homes with leaks', 'New construction', 'Old buildings'],
    faqs: [
      {
        q: 'Can you fix a leaking roof before the monsoon?',
        a: 'Yes, and earlier is better. Book a site visit well before the rains so the work is not rushed.',
      },
    ],
    related: ['aluminium-gutters', 'acp-facade', 'painting-texturing'],
    icon: 'roof',
  },
  {
    slug: 'acp-facade',
    name: 'ACP Facade Works',
    label: 'ACP facade',
    category: 'exteriors',
    title: 'ACP Facade & Cladding Works in Kerala',
    description:
      'Modern aluminium composite panel (ACP) facade and cladding in Kerala for homes, shops and offices. Design, fabrication, installation.',
    summary: 'Modern aluminium composite panel cladding for facades.',
    intro:
      'ACP cladding gives a building a clean, modern face and protects the structure behind it. Cercles designs, fabricates and installs ACP facades for homes, shops and offices, with the framing and sealing done for long-term performance.',
    includes: [
      'Facade design and colour selection',
      'Sub-frame fabrication',
      'ACP panel cutting and fitting',
      'Sealing and weather protection',
      'Signage and fascia work',
      'Final inspection',
    ],
    keralaNote:
      'In coastal and high-rainfall areas, joint sealing and fixings decide how a facade ages. We pay particular attention to both.',
    idealFor: ['Shops and showrooms', 'Modern villas', 'Office buildings'],
    faqs: [
      {
        q: 'Is ACP suitable for Kerala weather?',
        a: 'When the frame, fixings and joint sealing are done correctly, yes. The installation quality matters as much as the panel.',
      },
    ],
    related: ['aluminium-fabrication', 'painting-texturing', 'roofing'],
    icon: 'facade',
  },
  {
    slug: 'aluminium-fabrication',
    name: 'Aluminium Fabrication',
    label: 'Aluminium work',
    category: 'exteriors',
    title: 'Aluminium Fabrication: Windows, Partitions & Railings in Kerala',
    description:
      'Aluminium windows, partitions, railings and custom metalwork in Kerala. Precise fabrication, rust-free, neat installation.',
    summary: 'Windows, partitions, railings and custom metalwork.',
    intro:
      'Aluminium does not rust and suits Kerala conditions well. Cercles fabricates and installs aluminium windows, partitions, railings and custom metalwork, measured and made to fit.',
    includes: [
      'Aluminium windows and sliding systems',
      'Office and home partitions',
      'Balcony and staircase railings',
      'Custom metalwork',
      'Glass and glazing options',
      'Installation and sealing',
    ],
    keralaNote:
      'Salt air near the coast and constant humidity corrode ordinary metal quickly. Aluminium, with the right finish, avoids that.',
    idealFor: ['Homes and apartments', 'Offices and shops', 'Balconies and staircases'],
    faqs: [
      {
        q: 'Do you make custom shapes and sizes?',
        a: 'Yes. Fabrication is done to your measurements after a site visit.',
      },
    ],
    related: ['acp-facade', 'aluminium-gutters', 'interior-works'],
    icon: 'frame',
  },
  {
    slug: 'aluminium-gutters',
    name: 'Aluminium Rainwater Gutters',
    label: 'Rainwater gutters',
    category: 'exteriors',
    title: 'Aluminium Rainwater Gutters in Kerala',
    description:
      'Seamless aluminium rainwater gutters for roofs in Kerala. Durable, clean drainage that protects walls and foundations in heavy rain.',
    summary: 'Durable, clean rainwater drainage for your roof.',
    intro:
      'Without a gutter, monsoon water runs down the walls and pools at the foundation. Cercles installs aluminium rainwater gutters sized for Kerala rainfall and routed to proper drainage.',
    includes: [
      'Roof and eave assessment',
      'Gutter sizing for heavy rainfall',
      'Aluminium gutter and downpipe installation',
      'Drainage routing',
      'Leaf guards and cleaning access',
      'Final water test',
    ],
    keralaNote:
      'Kerala rainfall is intense and sudden. Undersized gutters overflow, so we size them for peak rain, not average rain.',
    idealFor: ['Villas and homes', 'New construction', 'Roof renovations'],
    faqs: [
      {
        q: 'Will gutters rust?',
        a: 'Aluminium does not rust, which is why it is a good choice for Kerala conditions.',
      },
    ],
    related: ['roofing', 'aluminium-fabrication', 'landscaping'],
    icon: 'gutter',
  },
  {
    slug: 'landscaping',
    name: 'Landscaping',
    label: 'Landscaping',
    category: 'outdoors',
    title: 'Landscaping & Garden Design in Kerala',
    description:
      'Landscaping in Kerala: softscape (plants, lawns, gardens) and hardscape (paving, walkways, patios, structures) designed and built end to end.',
    summary: 'Gardens, lawns, paving, walkways, patios and structures.',
    intro:
      'A garden is part of the home, not an afterthought. Cercles designs and builds both softscape (plants, lawns, gardens) and hardscape (paving, walkways, patios, structures) so the outdoors is finished to the same standard as the inside.',
    includes: [
      'Garden design and planning',
      'Plants, lawns and planting beds',
      'Paving, walkways and driveways',
      'Patios, pergolas and structures',
      'Outdoor lighting',
      'Irrigation planning',
    ],
    keralaNote:
      'Kerala grows almost anything, which is the challenge: without planning, gardens become overgrown. We choose plants for your light, soil and the effort you want to put in.',
    idealFor: ['New villas', 'Existing gardens', 'Resorts and homestays'],
    faqs: [
      {
        q: 'Do you do only plants, or hard landscaping too?',
        a: 'Both. Landscaping at Cercles covers softscaping and hardscaping under the same plan.',
      },
    ],
    related: ['irrigation', 'aluminium-gutters', 'electrical'],
    icon: 'leaf',
  },
  {
    slug: 'irrigation',
    name: 'Irrigation',
    label: 'Irrigation',
    category: 'outdoors',
    title: 'Automated Garden Irrigation Systems in Kerala',
    description:
      'Automated irrigation systems that water on schedule for gardens and lawns in Kerala. Design, installation and smart control.',
    summary: 'Automated systems that water your garden on schedule.',
    intro:
      'A garden that waters itself stays green when you are away. Cercles designs and installs irrigation systems with timers and automation, so each zone gets the right amount of water at the right time.',
    includes: [
      'Irrigation design by zone',
      'Drip and sprinkler systems',
      'Automatic timers and controllers',
      'Water source and pump planning',
      'Installation and testing',
      'Seasonal adjustment',
    ],
    keralaNote:
      'Monsoon months need almost no watering and summer months need a lot. Automation that can be adjusted by season saves both water and effort.',
    idealFor: ['Gardens and lawns', 'Villas and homestays', 'Homes where owners travel'],
    faqs: [
      {
        q: 'Can irrigation be added to an existing garden?',
        a: 'Yes. Systems can be retrofitted to an existing garden with minimal disturbance.',
      },
    ],
    related: ['landscaping', 'plumbing', 'electrical'],
    icon: 'sprinkler',
  },
];

export const SERVICE_BY_SLUG = Object.fromEntries(SERVICES.map((s) => [s.slug, s])) as Record<
  string,
  Service
>;

export const servicesIn = (cat: CategoryId) => SERVICES.filter((s) => s.category === cat);

export const PROCESS = [
  { n: '01', title: 'Enquiry and site visit', text: 'Tell us what you need. We visit and understand the space.' },
  { n: '02', title: 'Plan and quotation', text: 'A clear scope, timeline and price, for one service or the whole project.' },
  { n: '03', title: 'Execution', text: 'Skilled teams for each trade, coordinated by one project lead.' },
  { n: '04', title: 'Quality check', text: 'Every detail inspected before we call it done.' },
  { n: '05', title: 'Handover', text: 'A finished space, ready to enjoy.' },
];

export const HOME_FAQS = [
  {
    q: 'What does Cercles do?',
    a: 'Cercles is a one-stop home solutions company in Kerala. We design, build and finish every part of a home, inside and out: curtains, sofas, interiors, furniture, painting, electrical, plumbing, roofing, ACP facades, aluminium work, rainwater gutters, landscaping and irrigation.',
  },
  {
    q: 'Do I have to book the whole home, or can I book a single service?',
    a: 'Either. Every service can be booked on its own, or combined into one complete Full-Circle project with one quotation and one schedule.',
  },
  {
    q: 'How does the quotation work?',
    a: 'We visit your site, understand the scope, and give you a clear quotation with timeline and price. A complete project gets one combined quotation, and a single service gets one focused quotation.',
  },
  {
    q: 'Who are your customers?',
    a: 'Homeowners renovating or upgrading, owners of new villas and apartments who need a full fit-out, landlords and property investors, and small commercial spaces such as shops and offices.',
  },
  {
    q: 'How do I get started?',
    a: 'Call or WhatsApp +91 75599 42708, or send an enquiry from the contact page. We will arrange a site visit.',
  },
];

export const waLink = (text: string) =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
