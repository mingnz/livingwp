import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The article frontmatter contract, as written by the Python agent
 * (`normalize_article_metadata()` in src/livingwp/utils/files.py).
 * Older archives predate some fields, so those are optional or defaulted.
 * Archived files are immutable — the schema must keep accepting them as-is.
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './whitepaper/content' }),
  schema: z.object({
    title: z.string(),
    permalink: z.string(),
    article: z.boolean(),
    article_history: z.boolean(),
    article_latest: z.boolean(),
    article_version: z.boolean(),
    article_series: z.string(),
    article_updated_at: z.coerce.date(),
    article_kind: z.enum(['snapshot', 'industry']).default('industry'),
    article_summary: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    last_modified_at: z.coerce.date().optional(),
    layout: z.string().optional(),
  }),
});

export const collections = { articles };
