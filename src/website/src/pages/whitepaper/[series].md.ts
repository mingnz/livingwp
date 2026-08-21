import type { APIRoute } from 'astro';
import { getLatestArticles, formatDate } from '../../lib/articles';
import { PUBLISHER_NAME } from '../../lib/seo';

// Clean-markdown view of the latest edition of each report, for AI crawlers
// and "copy as markdown" — e.g. /whitepaper/healthcare.md.
export async function getStaticPaths() {
  const latest = await getLatestArticles();
  return latest.map((entry) => ({
    params: { series: entry.data.article_series },
    props: { entry },
  }));
}

export const GET: APIRoute = ({ props, site }) => {
  const { entry } = props;
  const source = new URL(entry.data.permalink, site).href;
  const header =
    `> Source: ${source} · Updated ${formatDate(entry.data.article_updated_at)} · ${PUBLISHER_NAME}\n` +
    '> Researched, written, and published autonomously by an AI agent; every run is auditable on GitHub.\n\n';
  return new Response(header + (entry.body ?? ''), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
