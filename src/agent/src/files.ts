import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { articleFrontmatterShape } from '@livingwp/article-contract';
import { formatMarkdown, parseMarkdown, type FrontMatter } from './markdown.js';

/**
 * The on-disk article contract, built from the shared definition with the
 * agent's own Zod instance. `.strict()` ensures the agent writes exactly the
 * contract fields and nothing else — drift fails loudly at generation time.
 */
const storedArticleSchema = z.object(articleFrontmatterShape(z)).strict();

const AGENT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_CONTENT_DIR = path.resolve(
  AGENT_ROOT,
  '..',
  'website',
  'whitepaper',
  'content',
);
export const SITE_ARCHIVE_DIR = path.join(SITE_CONTENT_DIR, 'archive');
export const INDUSTRIES_CONFIG_PATH = path.join(AGENT_ROOT, 'config', 'industries.json');
export const SITE_TIMEZONE = 'Pacific/Auckland';

export interface IndustryConfig {
  instructions_filename?: string;
  research_model?: string;
  title?: string;
  article_kind?: string;
  history_context_count?: number;
  stub_body?: string;
  file_store_name?: string;
  filename_urls?: Record<string, { title?: string; url?: string }>;
}

export interface ArchiveEntry {
  path: string;
  metadata: FrontMatter;
  body: string;
  articleUpdatedAt: DateTime;
}

/** Load <industry>.md from the website content folder, or null if it doesn't exist. */
export function loadIndustryArticle(industry: string): string | null {
  const filePath = path.join(SITE_CONTENT_DIR, `${industry}.md`);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}

/** Load archived article bodies and metadata for an article series, newest first. */
export async function loadArticleArchiveEntries(
  industry: string,
  limit?: number,
): Promise<ArchiveEntry[]> {
  const archiveDir = path.join(SITE_ARCHIVE_DIR, industry);
  if (!existsSync(archiveDir)) return [];

  const entries: ArchiveEntry[] = [];
  for (const filename of await readdir(archiveDir)) {
    if (!filename.endsWith('.md')) continue;
    const filePath = path.join(archiveDir, filename);
    const [metadata, body] = parseMarkdown(readFileSync(filePath, 'utf-8'));
    entries.push({
      path: filePath,
      metadata,
      body,
      articleUpdatedAt:
        parseArticleTimestamp(metadata['article_updated_at']) ??
        DateTime.fromMillis(0, { zone: SITE_TIMEZONE }),
    });
  }

  entries.sort((a, b) => b.articleUpdatedAt.toMillis() - a.articleUpdatedAt.toMillis());
  return limit != null ? entries.slice(0, limit) : entries;
}

/** Save the latest article for an industry to its stable sector URL. */
export function saveIndustryArticle(
  industry: string,
  article: string,
  articleUpdatedAt?: DateTime,
): void {
  const timestamp = articleUpdatedAt ?? currentArticleTimestamp();
  const [metadata, body] = parseMarkdown(article);
  const normalized = normalizeArticleMetadata(industry, metadata, body, timestamp, {
    latest: true,
  });
  writeFileSync(path.join(SITE_CONTENT_DIR, `${industry}.md`), normalized, 'utf-8');
}

/** Save a dated archive copy of the current latest article. */
export function archiveIndustryArticle(industry: string, article: string): string {
  const [metadata, body] = parseMarkdown(article);
  const timestamp =
    parseArticleTimestamp(metadata['article_updated_at']) ?? currentArticleTimestamp();

  const archiveSlug = buildArchiveSlug(industry, timestamp);
  const archivePath = path.join(SITE_ARCHIVE_DIR, industry, `${archiveSlug}.md`);
  mkdirSync(path.dirname(archivePath), { recursive: true });
  const normalized = normalizeArticleMetadata(industry, metadata, body, timestamp, {
    latest: false,
    archiveSlug,
  });
  writeFileSync(archivePath, normalized, 'utf-8');
  return archivePath;
}

export function currentArticleTimestamp(): DateTime {
  return DateTime.now().setZone(SITE_TIMEZONE).startOf('second');
}

export function parseArticleTimestamp(value: unknown): DateTime | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return DateTime.fromJSDate(value).setZone(SITE_TIMEZONE);
  }

  const text = String(value).trim();
  if (!text) return null;

  const parsed = DateTime.fromISO(text, { setZone: true });
  if (!parsed.isValid) return null;
  // Strings without an explicit zone (a trailing Z or ±hh:mm offset) are
  // interpreted in the site timezone rather than the host's. Without this,
  // a zone-less timestamp would be read in the CI runner's zone (UTC).
  if (!/(?:[Zz]|[+-]\d{2}:?\d{2})$/.test(text)) {
    return DateTime.fromISO(text, { zone: SITE_TIMEZONE });
  }
  return parsed;
}

export function buildArchiveSlug(industry: string, timestamp: DateTime): string {
  const baseSlug = timestamp.toFormat('yyyy-MM-dd-HHmmss');
  let candidate = baseSlug;
  let suffix = 1;
  while (existsSync(path.join(SITE_ARCHIVE_DIR, industry, `${candidate}.md`))) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
  return candidate;
}

export function normalizeArticleMetadata(
  industry: string,
  metadata: FrontMatter,
  body: string,
  articleUpdatedAt: DateTime,
  { latest, archiveSlug }: { latest: boolean; archiveSlug?: string },
): string {
  const isoTimestamp = articleUpdatedAt.toISO({ suppressMilliseconds: true });
  if (!latest && archiveSlug == null) {
    throw new Error('archiveSlug is required for archived articles');
  }

  // Build exactly the contract fields — do not carry forward arbitrary keys
  // from the source (e.g. the retired Jekyll `layout`/`date`/`last_modified_at`
  // still present in older articles).
  const normalized: FrontMatter = {
    title: metadata['title'] ?? `AI in ${titleCase(industry.replaceAll('_', ' '))}`,
    permalink: latest
      ? `/whitepaper/${industry}/`
      : `/whitepaper/${industry}/${archiveSlug}/`,
    article: latest,
    article_history: true,
    article_latest: latest,
    article_version: !latest,
    article_series: industry,
    article_kind: metadata['article_kind'] ?? 'industry',
    article_updated_at: isoTimestamp,
    article_summary: extractDescription(body, 320),
    description: extractDescription(body),
  };

  // Validate against the shared contract before writing, so any drift between
  // what the agent emits and what the site expects fails here, not at deploy.
  const result = storedArticleSchema.safeParse(normalized);
  if (!result.success) {
    throw new Error(
      `Normalized article for ${industry} does not satisfy the article contract: ` +
        result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    );
  }

  return formatMarkdown(normalized, body);
}

/** Extract a plain-text description from the first paragraph of markdown. */
// Lead lines that are metadata, not prose (date stamps, "snapshot date:",
// "updated from the … edition", etc.). The extracted description feeds the
// page meta description, OG/Twitter cards, JSON-LD, and llms.txt, so picking
// one of these as the summary hurts both SEO and GEO.
const METADATA_LEAD =
  /^(updated\b|last updated\b|snapshot date\b|snapshot:|published\b|publication date\b)/i;

export function extractDescription(body: string, maxLength = 160): string {
  // Strip headings, bold/italic markers, links, and images
  let text = body.replace(/^#+\s.*$/gm, '');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/\*{1,2}(.+?)\*{1,2}/g, '$1');
  text = text.replace(/_+(.+?)_+/g, '$1');

  const truncate = (s: string) => {
    if (s.length <= maxLength) return s;
    const head = s.slice(0, maxLength - 1);
    return `${head.slice(0, head.lastIndexOf(' '))}…`;
  };

  // Prefer the first paragraph that reads like prose (long enough and with
  // sentence punctuation), so headings, labels, and date lines aren't used.
  // Fall back to the first non-metadata paragraph so we never return empty.
  let fallback = '';
  for (const paragraph of text.split('\n\n')) {
    const cleaned = paragraph.split(/\s+/).join(' ').trim();
    if (cleaned.length <= 20 || METADATA_LEAD.test(cleaned)) continue;
    if (!fallback) fallback = cleaned;
    if (cleaned.length >= 60 && /[.!?]/.test(cleaned)) {
      return truncate(cleaned);
    }
  }

  return fallback ? truncate(fallback) : '';
}

export function loadInstruction(filename: string): string {
  return readFileSync(path.join(AGENT_ROOT, 'prompts', filename), 'utf-8');
}

export function loadIndustryConfig(): Record<string, IndustryConfig> {
  return JSON.parse(readFileSync(INDUSTRIES_CONFIG_PATH, 'utf-8'));
}

/**
 * Add an industry to industries.json and return the key used.
 * Lowercases the name and replaces spaces with underscores.
 */
export function addIndustry(industryName: string): string {
  const industryKey = industryName.toLowerCase().replaceAll(' ', '_');
  const config = loadIndustryConfig();
  config[industryKey] = {
    instructions_filename: 'instructions_research.md',
    research_model: DEFAULT_INDUSTRY_MODEL,
  };
  writeFileSync(INDUSTRIES_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  return industryKey;
}

/** Default model written into new industry config entries. */
const DEFAULT_INDUSTRY_MODEL = 'gpt-5.4-2026-03-05';

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}
