import type { APIRoute } from 'astro';
import {
  getLatestSnapshot,
  getIndustryReports,
  formatDate,
} from '../lib/articles';

// https://llmstxt.org/ — a curated, link-first index for LLMs. Lists the
// latest edition of each report with a one-line summary so a model can decide
// what to fetch (the full text lives at /llms-full.txt and /whitepaper/<s>.md).
export const GET: APIRoute = async ({ site }) => {
  const abs = (p: string) => new URL(p, site!).href;
  const snapshot = await getLatestSnapshot();
  const reports = await getIndustryReports();

  const summary = (a: { data: { article_summary?: string; description?: string } }) =>
    a.data.article_summary ?? a.data.description ?? '';

  const lines: string[] = [
    '# AI in NZ Living Whitepaper',
    '',
    '> A living record of how generative AI is being adopted across industries in Aotearoa New Zealand. Each report is researched, written, and published autonomously by an AI agent each month, with a public audit trail of every run on GitHub. Reports cite primary sources inline.',
    '',
  ];

  if (snapshot) {
    lines.push(
      '## National snapshot',
      '',
      `- [${snapshot.data.title}](${abs(snapshot.data.permalink)}): ${summary(snapshot)} (updated ${formatDate(snapshot.data.article_updated_at)})`,
      '',
    );
  }

  lines.push('## Industry reports', '');
  for (const r of reports) {
    lines.push(
      `- [${r.data.title}](${abs(r.data.permalink)}): ${summary(r)} (updated ${formatDate(r.data.article_updated_at)})`,
    );
  }

  lines.push(
    '',
    '## Full content',
    '',
    `- [All reports concatenated](${abs('/llms-full.txt')})`,
    '- Each report is also available as Markdown at `/whitepaper/<series>.md`',
    '',
    '## About',
    '',
    `- [How it works](${abs('/how-it-works/')}): how the AI agent researches and publishes each report`,
    `- [About](${abs('/about/')}): the AI Forum NZ Generative AI Working Group`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
