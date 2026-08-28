// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://pazdj.com',
  integrations: [sitemap()],
  trailingSlash: 'ignore',
  build: {
    // One page, one stylesheet: keeps the critical path to a single request.
    inlineStylesheets: 'auto',
  },
  image: {
    // Sharp handles the AVIF/WebP derivatives generated at build time.
    responsiveStyles: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
