// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.livingwhitepaper.com',
  // 'ignore' (the default) — pages still emit as directory/index.html (trailing
  // slash) and canonicals/sitemap use that form, but extension endpoints like
  // /whitepaper/<series>.md resolve cleanly in dev too. 'always' wrongly forces
  // a trailing slash onto those dynamic .md endpoints (404 in dev).
  trailingSlash: 'ignore',
  // The default HTML compression collapses the newline between prose text and
  // an inline element (e.g. "under the\n<a>…" renders as "under theAI Forum"),
  // eating intended spaces around links. Gzip makes the size cost negligible.
  compressHTML: false,
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
