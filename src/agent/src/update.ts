import { getResearchAgent, performResearch } from './agent.js';
import {
  archiveIndustryArticle,
  currentArticleTimestamp,
  loadArticleArchiveEntries,
  loadIndustryArticle,
  loadIndustryConfig,
  saveIndustryArticle,
  titleCase,
  type ArchiveEntry,
  type IndustryConfig,
} from './files.js';
import { formatMarkdown, parseMarkdown, type FrontMatter } from './markdown.js';
import {
  buildArticleUsageReport,
  buildUsageReport,
  writeUsageCommentIfConfigured,
  writeUsageReportIfConfigured,
  type ArticleUsageReport,
  type UsageReport,
} from './usage.js';

const HISTORY_EXCERPT_MAX_CHARS = 2500;

export function excerptHistoryBody(body: string, maxChars = HISTORY_EXCERPT_MAX_CHARS): string {
  const paragraphs: string[] = [];
  let totalChars = 0;

  for (const paragraph of body.split('\n\n')) {
    const cleaned = paragraph.trim();
    if (!cleaned) continue;

    const separator = paragraphs.length > 0 ? 2 : 0;
    const projectedTotal = totalChars + separator + cleaned.length;
    if (projectedTotal <= maxChars) {
      paragraphs.push(cleaned);
      totalChars = projectedTotal;
      continue;
    }

    const remaining = maxChars - totalChars - separator;
    if (remaining > 80) {
      const slice = cleaned.slice(0, remaining);
      paragraphs.push(`${slice.slice(0, slice.lastIndexOf(' '))}…`);
    }
    break;
  }

  return paragraphs.join('\n\n').trim();
}

export function formatHistoryContext(
  industry: string,
  historyEntries: ArchiveEntry[],
): string {
  const defaultTitle = titleCase(industry.replaceAll('_', ' '));
  return historyEntries
    .map((entry) => {
      const title = String(entry.metadata['title'] ?? defaultTitle);
      const updatedAt = String(entry.metadata['article_updated_at'] ?? 'unknown');
      const body = excerptHistoryBody(entry.body);
      return `### ${title}\nUpdated: ${updatedAt}\n\n${body}`;
    })
    .join('\n\n');
}

function getHistoryContextCount(config: IndustryConfig): number {
  const value = Number(config.history_context_count ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export async function buildResearchInput(
  industryName: string,
  frontMatter: FrontMatter,
  body: string,
  config: IndustryConfig = {},
): Promise<string> {
  const lines = [
    `Current date: ${currentArticleTimestamp().toISODate()}`,
    `Topic: ${frontMatter['title'] ?? industryName.replaceAll('-', ' ')}`,
    `Article slug: ${industryName}`,
  ];

  const previousUpdatedAt = frontMatter['article_updated_at'];
  if (previousUpdatedAt) {
    lines.push(`Previous latest article updated at: ${previousUpdatedAt}`);
  }

  lines.push(
    '',
    'Previous latest article:',
    body.trim() || '(No previous article content.)',
  );

  const historyContextCount = getHistoryContextCount(config);
  if (historyContextCount > 0) {
    const historyEntries = await loadArticleArchiveEntries(
      industryName,
      historyContextCount,
    );
    if (historyEntries.length > 0) {
      lines.push(
        '',
        `Archived article context (most recent ${historyEntries.length}):`,
        formatHistoryContext(industryName, historyEntries),
      );
    }
  }

  return lines.join('\n');
}

export function getArticleStub(industry: string, config: IndustryConfig = {}): string {
  console.log(`Creating article stub for new article: ${industry}`);
  const title = config.title ?? `AI in ${titleCase(industry.replaceAll('_', ' '))}`;
  const articleKind = config.article_kind ?? 'industry';
  const frontMatter: FrontMatter = {
    title,
    permalink: `/whitepaper/${industry}/`,
    article: true,
    article_history: true,
    article_latest: true,
    article_kind: articleKind,
    article_series: industry,
  };
  const body =
    config.stub_body ??
    `This page is a placeholder for updates on AI adoption in the ${industry} ` +
      'sector of Aotearoa New Zealand. It will be populated automatically by ' +
      'an LLM agent as new information becomes available.';
  return formatMarkdown(frontMatter, body);
}

/** Run the agent pipeline for each configured article. */
export async function updateArticles(articleFilter?: string): Promise<UsageReport> {
  console.log(`Update with filter: ${articleFilter || 'all articles'}`);
  const industryConfig = loadIndustryConfig();
  let industries = Object.keys(industryConfig);
  if (articleFilter) {
    const inFilter = new Set(articleFilter.split(','));
    industries = industries.filter((industry) => inFilter.has(industry));
  }

  const articleReports: ArticleUsageReport[] = [];
  const failures: string[] = [];
  // Sequential by design: each iteration is a network-heavy LLM + web-search
  // run, so running them in parallel would multiply provider rate-limit
  // pressure and interleave the streaming logs. A throw in one industry must
  // not abort the others or lose the usage report, so each is isolated.
  for (const industryName of industries) {
    try {
      const articleConfig = industryConfig[industryName] ?? {};
      const { agent, modelName, reasoningEffort } = await getResearchAgent(
        industryName,
        articleConfig,
      );
      console.log(
        `Researching ${industryName} with ${modelName} (reasoning effort: ${reasoningEffort})`,
      );
      const existingArticle = loadIndustryArticle(industryName);
      const text = existingArticle ?? getArticleStub(industryName, articleConfig);
      const [frontMatter, body] = parseMarkdown(text);
      const topic = String(frontMatter['title'] ?? industryName.replaceAll('-', ' '));
      const initialInput = await buildResearchInput(
        industryName,
        frontMatter,
        body,
        articleConfig,
      );
      const researchResult = await performResearch(topic, agent, initialInput);
      articleReports.push(
        buildArticleUsageReport({
          industry: industryName,
          topic,
          modelName,
          result: researchResult,
        }),
      );

      // Never destroy a good article on a failed/incomplete run. A research run
      // that returns no usable text (e.g. a dropped connection, a content
      // filter, or an incomplete response) must leave the existing article and
      // its archive untouched rather than archiving the good version and
      // overwriting it with an empty body.
      const newBody = researchResult.text.trim();
      if (researchResult.finishReason !== 'stop' || newBody.length < MIN_ARTICLE_BODY_CHARS) {
        console.error(
          `Research for ${industryName} produced no usable output ` +
            `(finishReason=${researchResult.finishReason}, body length=${newBody.length}); ` +
            'leaving the existing article unchanged.',
        );
        failures.push(industryName);
        continue;
      }

      console.log(`Research result for ${topic}:\n${newBody}\n`);
      const updated = formatMarkdown(frontMatter, newBody);
      if (existingArticle) {
        const archivePath = archiveIndustryArticle(industryName, existingArticle);
        console.log(`Archived previous version for ${industryName} to ${archivePath}`);
      }
      saveIndustryArticle(industryName, updated);
    } catch (error) {
      // Isolate the failure: record it, keep going, and still emit the usage
      // report below so accounting for completed industries isn't lost.
      console.error(`Research for ${industryName} threw: ${error}`);
      failures.push(industryName);
    }
  }

  const usageReport = buildUsageReport({
    articleFilter: articleFilter ?? null,
    articleReports,
  });
  writeUsageReportIfConfigured(usageReport);
  writeUsageCommentIfConfigured(usageReport);

  if (failures.length > 0) {
    throw new Error(
      `Research failed to produce usable output for: ${failures.join(', ')}. ` +
        'Their articles were left unchanged.',
    );
  }

  return usageReport;
}

/**
 * Minimum body length for a research result to be considered usable. Real
 * articles are many kilobytes; anything shorter signals a failed or truncated
 * run that must not overwrite the existing article.
 */
const MIN_ARTICLE_BODY_CHARS = 200;
