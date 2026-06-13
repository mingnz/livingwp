import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

const byUpdatedDesc = (a: Article, b: Article) =>
  b.data.article_updated_at.getTime() - a.data.article_updated_at.getTime();

/** Route param for a permalink, e.g. "/whitepaper/healthcare/" -> "whitepaper/healthcare". */
export function permalinkToSlug(permalink: string): string {
  return permalink.replace(/^\/+|\/+$/g, '');
}

export async function getAllArticles(): Promise<Article[]> {
  return getCollection('articles');
}

/** Latest edition of every series (the articles shown in indexes). */
export async function getLatestArticles(): Promise<Article[]> {
  return getCollection('articles', ({ data }) => data.article_latest);
}

/** The most recent national snapshot, if one has been published. */
export async function getLatestSnapshot(): Promise<Article | undefined> {
  const snapshots = (await getLatestArticles()).filter(
    (a) => a.data.article_kind === 'snapshot',
  );
  return snapshots.sort(byUpdatedDesc)[0];
}

/** Latest industry reports, alphabetical by title (matches the Jekyll index). */
export async function getIndustryReports(): Promise<Article[]> {
  const reports = (await getLatestArticles()).filter(
    (a) => a.data.article_kind !== 'snapshot',
  );
  return reports.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

/** Every edition in a series, newest first. */
export async function getSeriesHistory(series: string): Promise<Article[]> {
  const editions = await getCollection(
    'articles',
    ({ data }) => data.article_series === series,
  );
  return editions.sort(byUpdatedDesc);
}

const longDate = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Pacific/Auckland',
});

const shortDate = new Intl.DateTimeFormat('en-NZ', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Pacific/Auckland',
});

export const formatDate = (date: Date) => longDate.format(date);
export const formatDateShort = (date: Date) => shortDate.format(date);
