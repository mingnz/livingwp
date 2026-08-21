import type { APIRoute } from 'astro';
import {
  getLatestSnapshot,
  getIndustryReports,
  formatDate,
  type Article,
} from '../lib/articles';
import { PUBLISHER_NAME } from '../lib/seo';

// The full corpus in one fetch: the latest edition of every report,
// concatenated. Lets an LLM ingest the whole site without crawling.
export const GET: APIRoute = async ({ site }) => {
  const abs = (p: string) => new URL(p, site!).href;
  const snapshot = await getLatestSnapshot();
  const reports = await getIndustryReports();
  const entries: Article[] = [snapshot, ...reports].filter(
    (e): e is Article => Boolean(e),
  );

  const parts: string[] = [
    '# AI in NZ Living Whitepaper — full content',
    '',
    `> Latest edition of every report — researched, written, and published autonomously by an AI agent for ${PUBLISHER_NAME}, with every run auditable on GitHub.`,
    `> Source: ${abs('/')} · Index: ${abs('/llms.txt')}`,
    '',
    '---',
    '',
  ];

  for (const entry of entries) {
    parts.push(
      `> Source: ${abs(entry.data.permalink)} · Updated ${formatDate(entry.data.article_updated_at)}`,
      '',
      entry.body ?? '',
      '',
      '---',
      '',
    );
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
