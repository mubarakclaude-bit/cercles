// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';


export default defineConfig({
  // The live site is cercles.in. A test copy can be built under another address with DEMO_SITE / DEMO_BASE.
  site: process.env.DEMO_SITE || 'https://cercles.in',
  base: process.env.DEMO_BASE || '/',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'viewport' },

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'monthly',
      priority: 0.7,
    }),
  ],
});