# Cercles website

Static, SEO-first site for Cercles (cercles.in). Built with Astro, no UI framework, about 2.5 KB of JavaScript.

## Commands

- `npm run dev` : local development
- `npm run build` : build to `dist/` (also writes the sitemap)
- `npm run preview` : serve the built site
- `node scripts/make-assets.mjs` : regenerate favicon, app icons and the share image from `src/assets/brand`

## Where things are

- `src/data/site.ts` : business facts, the 13 services, areas, FAQs. Pages, menus, sitemap and structured data all read from here.
- `src/lib/schema.ts` : JSON-LD. Address, geo and founding year are added automatically once set in `SITE`.
- `src/styles/global.css` : design tokens and all styles (brand colours from the logo package).
- `src/scene/` : the 3D home (three.js, loaded after first paint). `build.ts` makes the house, interior, wiring, pipes and garden from simple shapes; `director.ts` holds the scroll stages; `index.ts` runs the camera, pins and panels.
- `src/components/Story.astro` : the home-page story, as plain HTML text and links.
- `src/scripts/main.ts` : the only client script (menu, reveal, journey, form).
- `src/assets/brand/` : the supplied logo package (not shipped unless imported).

## To fill in when known

1. `SITE.address`, `SITE.geo`, `SITE.mapUrl`, `SITE.foundingYear` in `src/data/site.ts`
2. Project photos and a portfolio page
3. Real customer reviews (Google Business Profile first)

## Test copy (GitHub Pages)

Every push to `main` builds a test copy with `npm run build:demo` and publishes it with GitHub Pages (`.github/workflows/pages.yml`). The test copy lives under the repository's sub-path, is marked noindex, and has its own `robots.txt` that blocks search engines. The real site is built with plain `npm run build` and is not hosted yet.
