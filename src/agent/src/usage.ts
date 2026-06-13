import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ResearchResult } from './agent.js';
import { WEB_SEARCH_TOOL_NAMES } from './agent.js';

export const USAGE_REPORT_PATH_ENV = 'LIVINGWP_USAGE_REPORT_PATH';
export const USAGE_COMMENT_PATH_ENV = 'LIVINGWP_USAGE_COMMENT_PATH';
export const MODEL_PRICING_OVERRIDES_ENV = 'LIVINGWP_MODEL_PRICING_OVERRIDES_JSON';
export const WEB_SEARCH_COST_ENV = 'LIVINGWP_WEB_SEARCH_COST_PER_1000_USD';
export const USAGE_COMMENT_MARKER = '<!-- livingwp-usage-report -->';

interface ModelPricing {
  input_per_million_usd: number;
  cached_input_per_million_usd: number;
  output_per_million_usd: number;
}

// Default rates are sourced from the providers' public pricing pages and can
// be overridden in CI via LIVINGWP_MODEL_PRICING_OVERRIDES_JSON.
const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-5.4': {
    input_per_million_usd: 2.5,
    cached_input_per_million_usd: 0.25,
    output_per_million_usd: 15.0,
  },
};
const DEFAULT_WEB_SEARCH_COST_PER_1000_USD = 10.0;

export interface ArticleUsageReport {
  industry: string;
  topic: string;
  model: string;
  pricing_model: string | null;
  requests: number;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
  web_search_calls: number;
  estimated_cost_usd: string | null;
  cost_complete: boolean;
}

export interface UsageReport {
  generated_at: string;
  article_filter: string | null;
  articles: ArticleUsageReport[];
  totals: Record<string, number | string | boolean | null>;
  unpriced_models: string[];
}

export function buildArticleUsageReport(options: {
  industry: string;
  topic: string;
  modelName: string;
  result: ResearchResult;
}): ArticleUsageReport {
  const { industry, topic, modelName, result } = options;
  const usage = result.totalUsage;
  const webSearchCalls = countWebSearchCalls(result);

  const inputTokens = usage.inputTokens ?? 0;
  const cachedInputTokens = usage.inputTokenDetails?.cacheReadTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const reasoningTokens = usage.outputTokenDetails?.reasoningTokens ?? 0;
  const totalTokens = usage.totalTokens ?? inputTokens + outputTokens;

  const [estimatedCost, pricingModel] = estimateUsageCost({
    modelName,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    webSearchCalls,
  });

  return {
    industry,
    topic,
    model: modelName,
    pricing_model: pricingModel,
    requests: result.steps.length,
    input_tokens: inputTokens,
    cached_input_tokens: cachedInputTokens,
    output_tokens: outputTokens,
    reasoning_tokens: reasoningTokens,
    total_tokens: totalTokens,
    web_search_calls: webSearchCalls,
    estimated_cost_usd: estimatedCost != null ? formatCostValue(estimatedCost) : null,
    cost_complete: estimatedCost != null,
  };
}

export function buildUsageReport(options: {
  articleFilter: string | null;
  articleReports: ArticleUsageReport[];
}): UsageReport {
  const { articleFilter, articleReports } = options;
  let totalCost = 0;
  let costComplete = true;
  let hasPricedCost = false;
  const unpricedModels = new Set<string>();

  const totals: Record<string, number> = {
    articles: articleReports.length,
    requests: 0,
    input_tokens: 0,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_tokens: 0,
    total_tokens: 0,
    web_search_calls: 0,
  };

  for (const report of articleReports) {
    totals['requests']! += report.requests;
    totals['input_tokens']! += report.input_tokens;
    totals['cached_input_tokens']! += report.cached_input_tokens;
    totals['output_tokens']! += report.output_tokens;
    totals['reasoning_tokens']! += report.reasoning_tokens;
    totals['total_tokens']! += report.total_tokens;
    totals['web_search_calls']! += report.web_search_calls;

    if (report.estimated_cost_usd == null) {
      costComplete = false;
      unpricedModels.add(report.model);
      continue;
    }
    hasPricedCost = true;
    totalCost += Number(report.estimated_cost_usd);
  }

  return {
    generated_at: new Date().toISOString(),
    article_filter: articleFilter,
    articles: articleReports,
    totals: {
      ...totals,
      estimated_cost_usd:
        hasPricedCost || costComplete ? formatCostValue(totalCost) : null,
      cost_complete: costComplete,
    },
    unpriced_models: [...unpricedModels].sort(),
  };
}

export function writeUsageReportIfConfigured(report: UsageReport): void {
  const outputPath = process.env[USAGE_REPORT_PATH_ENV];
  if (!outputPath) return;
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote usage report to ${outputPath}`);
}

export function writeUsageCommentIfConfigured(report: UsageReport): void {
  const outputPath = process.env[USAGE_COMMENT_PATH_ENV];
  if (!outputPath) return;
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, formatUsageComment(report));
  console.log(`Wrote usage comment to ${outputPath}`);
}

export function formatUsageSummary(report: UsageReport): string {
  const totals = report.totals;
  const estimatedCost = totals['estimated_cost_usd'];
  let costLabel = estimatedCost != null ? String(estimatedCost) : 'n/a';
  // "(partial estimate)" only makes sense when there is a partial figure to
  // qualify; an unpriced run is just "n/a".
  if (estimatedCost != null && !totals['cost_complete']) {
    costLabel = `${costLabel} (partial estimate)`;
  }

  return (
    'Usage summary: ' +
    `${totals['articles']} article(s), ` +
    `${totals['requests']} request(s), ` +
    `${totals['total_tokens']} total token(s), ` +
    `${totals['web_search_calls']} web search call(s), ` +
    `estimated cost $${costLabel}`
  );
}

export function formatUsageComment(report: UsageReport): string {
  const totals = report.totals;
  const costLabel = formatUsageCostLabel(
    totals['estimated_cost_usd'] as string | null,
    Boolean(totals['cost_complete']),
  );

  const articleRows = report.articles.map(
    (article) =>
      '| ' +
      [
        article.industry,
        `\`${article.model}\``,
        formatUsageInteger(article.total_tokens),
        formatUsageInteger(article.input_tokens),
        formatUsageInteger(article.output_tokens),
        formatUsageInteger(article.web_search_calls),
        formatUsageCostLabel(article.estimated_cost_usd, article.cost_complete),
      ].join(' | ') +
      ' |',
  );

  let table = [
    '| Article | Model | Total tokens | Input | Output | Web searches | Estimated cost |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...articleRows,
  ].join('\n');
  if (articleRows.length === 0) table = '_No articles were processed._';

  const lines = [
    USAGE_COMMENT_MARKER,
    '## Generation Usage',
    '',
    `- Generated at: ${report.generated_at}`,
    `- Articles processed: ${formatUsageInteger(totals['articles'] as number)}`,
    `- Requests: ${formatUsageInteger(totals['requests'] as number)}`,
    `- Total tokens: ${formatUsageInteger(totals['total_tokens'] as number)}`,
    `- Cached input tokens: ${formatUsageInteger(totals['cached_input_tokens'] as number)}`,
    `- Reasoning tokens: ${formatUsageInteger(totals['reasoning_tokens'] as number)}`,
    `- Web search calls: ${formatUsageInteger(totals['web_search_calls'] as number)}`,
    `- Estimated cost: ${costLabel}`,
  ];

  if (report.article_filter) {
    lines.push(`- Filter: \`${report.article_filter}\``);
  }

  lines.push(
    '',
    table,
    '',
    'Estimated cost is derived from token usage plus provider web-search call pricing.',
  );

  if (report.unpriced_models.length > 0) {
    const unpriced = report.unpriced_models.map((m) => `\`${m}\``).join(', ');
    lines.push('', `Cost could not be calculated for: ${unpriced}.`);
  }

  return `${lines.join('\n')}\n`;
}

export function countWebSearchCalls(result: ResearchResult): number {
  let count = 0;
  for (const step of result.steps) {
    for (const part of step.content) {
      if (part.type === 'tool-call' && WEB_SEARCH_TOOL_NAMES.has(part.toolName)) {
        count += 1;
      }
    }
  }
  return count;
}

function estimateUsageCost(options: {
  modelName: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  webSearchCalls: number;
}): [number | null, string | null] {
  const { modelName, inputTokens, cachedInputTokens, outputTokens, webSearchCalls } =
    options;
  const pricingModel = resolvePricingModel(modelName);
  if (pricingModel == null) return [null, null];

  const pricing = loadModelPricing()[pricingModel]!;
  const uncachedInputTokens = Math.max(inputTokens - cachedInputTokens, 0);
  const webSearchCost = (webSearchCalls * getWebSearchCostPer1000()) / 1000;

  const estimatedCost =
    (uncachedInputTokens * pricing.input_per_million_usd) / 1_000_000 +
    (cachedInputTokens * pricing.cached_input_per_million_usd) / 1_000_000 +
    (outputTokens * pricing.output_per_million_usd) / 1_000_000 +
    webSearchCost;
  return [estimatedCost, pricingModel];
}

function resolvePricingModel(modelName: string): string | null {
  const pricing = loadModelPricing();
  // Strip an optional provider prefix, then an optional date/latest suffix.
  const bareName = modelName.includes('/')
    ? modelName.slice(modelName.indexOf('/') + 1)
    : modelName;
  for (const candidate of [modelName, bareName]) {
    if (candidate in pricing) return candidate;
    const normalized = candidate.replace(/-(?:\d{4}-\d{2}-\d{2}|latest)$/, '');
    if (normalized in pricing) return normalized;
  }
  return null;
}

function loadModelPricing(): Record<string, ModelPricing> {
  const pricing: Record<string, ModelPricing> = { ...DEFAULT_MODEL_PRICING };

  const overrides = process.env[MODEL_PRICING_OVERRIDES_ENV];
  if (!overrides) return pricing;

  let payload: unknown;
  try {
    payload = JSON.parse(overrides);
  } catch (error) {
    console.warn(`Ignoring invalid ${MODEL_PRICING_OVERRIDES_ENV}: ${error}`);
    return pricing;
  }

  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
    console.warn(
      `Ignoring invalid ${MODEL_PRICING_OVERRIDES_ENV}: expected a JSON object`,
    );
    return pricing;
  }

  for (const [modelName, values] of Object.entries(payload)) {
    const input = Number(values?.input_per_million_usd);
    const cached = Number(values?.cached_input_per_million_usd);
    const output = Number(values?.output_per_million_usd);
    if ([input, cached, output].some(Number.isNaN)) {
      console.warn(`Ignoring invalid pricing override for model ${modelName}`);
      continue;
    }
    pricing[modelName] = {
      input_per_million_usd: input,
      cached_input_per_million_usd: cached,
      output_per_million_usd: output,
    };
  }

  return pricing;
}

function getWebSearchCostPer1000(): number {
  const configured = process.env[WEB_SEARCH_COST_ENV];
  if (!configured) return DEFAULT_WEB_SEARCH_COST_PER_1000_USD;
  const parsed = Number(configured);
  if (Number.isNaN(parsed)) {
    console.warn(
      `Ignoring invalid ${WEB_SEARCH_COST_ENV} value ${JSON.stringify(configured)}; using default`,
    );
    return DEFAULT_WEB_SEARCH_COST_PER_1000_USD;
  }
  return parsed;
}

function formatUsageInteger(value: number | string): string {
  return Math.trunc(Number(value)).toLocaleString('en-US');
}

function formatUsageCostLabel(
  estimatedCostUsd: string | null,
  costComplete: boolean,
): string {
  if (estimatedCostUsd == null) return 'n/a (partial)';
  const costLabel = `$${Number(estimatedCostUsd).toFixed(4)}`;
  return costComplete ? costLabel : `${costLabel} (partial)`;
}

function formatCostValue(value: number): string {
  return value.toFixed(6);
}
