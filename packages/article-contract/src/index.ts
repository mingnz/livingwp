import type { z as ZodNamespace } from 'zod';

type Zod = typeof ZodNamespace;

/**
 * The article frontmatter contract — the single source of truth for the fields
 * shared between the agent (which writes them in `normalizeArticleMetadata`)
 * and the Astro site (which validates them in its content collection and
 * renders them).
 *
 * This describes the **on-disk** form, where timestamps are ISO 8601 strings.
 * The Astro site layers read-time coercion (string -> Date) on top via
 * `.extend()`, since its components want `Date` objects.
 *
 * It's a factory that takes the caller's Zod instance so the agent and Astro
 * each build the schema with their own Zod copy — avoiding the cross-instance
 * issues that come from passing a schema built by one Zod copy to another.
 *
 * Inert Jekyll-era fields (`layout`, `date`, `last_modified_at`) are
 * intentionally absent: the agent no longer writes them. Archived files that
 * still contain them remain valid because the schema strips unknown keys.
 */
export function articleFrontmatterShape(z: Zod) {
  return {
    title: z.string(),
    permalink: z.string(),
    article: z.boolean(),
    article_history: z.boolean(),
    article_latest: z.boolean(),
    article_version: z.boolean(),
    article_series: z.string(),
    article_kind: z.enum(['snapshot', 'industry']).default('industry'),
    /** ISO 8601 string on disk; the site coerces this to a Date on read. */
    article_updated_at: z.string(),
    article_summary: z.string().optional(),
    description: z.string().optional(),
  };
}

/** Article kinds recognised by the site (industry report vs national snapshot). */
export const ARTICLE_KINDS = ['snapshot', 'industry'] as const;
export type ArticleKind = (typeof ARTICLE_KINDS)[number];
