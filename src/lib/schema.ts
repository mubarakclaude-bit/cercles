import { SITE, SERVICES, AREAS, type Service, type Area } from '../data/site';

const abs = (path: string) => new URL(path, SITE.url).href;
const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

/** Only includes address/geo/founding details once they are actually known. */
export function organizationSchema() {
  const node: Record<string, unknown> = {
    '@type': ['HomeAndConstructionBusiness', 'LocalBusiness'],
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: SITE.brand,
    url: SITE.url,
    logo: abs('/brand/cercles-logo.svg'),
    image: abs('/og.png'),
    description: SITE.description,
    slogan: SITE.tagline,
    telephone: SITE.phoneRaw,
    email: SITE.email,
    sameAs: [SITE.instagram],
    areaServed: AREAS.map((a) => ({
      '@type': a.tier === 'nearby-state' ? 'City' : 'AdministrativeArea',
      name: a.name,
    })),
    knowsAbout: SERVICES.map((s) => s.name),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE.phoneRaw,
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Malayalam'],
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Home improvement services',
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: abs(`/services/${s.slug}/`) },
      })),
    },
  };
  if (SITE.address) {
    node.address = {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    };
  } else {
    node.address = { '@type': 'PostalAddress', addressLocality: 'Kozhikode', addressRegion: 'Kerala', addressCountry: 'IN' };
  }
  if (SITE.geo) node.geo = { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng };
  if (SITE.foundingYear) node.foundingDate = String(SITE.foundingYear);
  if (SITE.mapUrl) node.hasMap = SITE.mapUrl;
  return node;
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE.url,
    name: SITE.name,
    inLanguage: 'en-IN',
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function serviceSchema(s: Service) {
  return {
    '@type': 'Service',
    '@id': abs(`/services/${s.slug}/`) + '#service',
    name: s.name,
    serviceType: s.name,
    description: s.description,
    url: abs(`/services/${s.slug}/`),
    provider: { '@id': ORG_ID },
    areaServed: AREAS.map((a) => ({ '@type': a.tier === 'nearby-state' ? 'City' : 'AdministrativeArea', name: a.name })),
  };
}

export function areaPageSchema(a: Area) {
  return {
    '@type': 'WebPage',
    '@id': abs(`/areas/${a.slug}/`) + '#page',
    url: abs(`/areas/${a.slug}/`),
    name: `Home improvement in ${a.name}`,
    about: { '@id': ORG_ID },
    mainEntity: { '@type': 'Place', name: a.name, containedInPlace: { '@type': 'AdministrativeArea', name: a.state } },
  };
}

export const graph = (...nodes: unknown[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
