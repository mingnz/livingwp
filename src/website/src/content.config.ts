import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { articleFrontmatterShape } from '@livingwp/article-contract';

/**
 * Article frontmatter contract. Field names and types come from the shared
 * `@livingwp/article-contract` package — the same definition the agent
 * validates its output against — so the two ends can't drift.
 *
 * The shared shape describes the on-disk form (ISO string timestamps); here we
 * override `article_updated_at` with `z.coerce.date()` because the site's
 * components render it as a `Date`. Unknown keys (e.g. the Jekyll-era `layout`
 * still present in older archives) are stripped, so immutable archives stay
 * valid without re-listing retired fields.
 *
 * Zod is imported directly rather than from `astro:content`, whose `z`
 * re-export is deprecated in Astro 7 now that collections accept any Standard
 * Schema validator.
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './whitepaper/content' }),
  schema: z.object(articleFrontmatterShape(z)).extend({
    article_updated_at: z.coerce.date(),
  }),
});

export const collections = { articles };
