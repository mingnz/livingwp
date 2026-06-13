// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.livingwhitepaper.com',
  trailingSlash: 'always',
  integrations: [
    // Keep archived editions (…/whitepaper/<series>/<timestamp>/) out of the
    // sitemap — they're noindexed near-duplicates of the latest version.
    sitemap({
      filter: (page) => !/\/whitepaper\/[^/]+\/\d{4}-\d{2}-\d{2}/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
