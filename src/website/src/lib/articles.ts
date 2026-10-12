import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

const byUpdatedDesc = (a: Article, b: Article) =>
  b.data.article_updated_at.getTime() - a.data.article_updated_at.getTime();

/** Route param for a permalink, e.g. "/whitepaper/healthcare/" -> "whitepaper/healthcare". */
export function permalinkToSlug(permalink: string): string {
  return permalink.replace(/^\/+|\/+$/g, '');
}

/** One-paragraph summary for cards and meta tags. */
export const summaryOf = (a: Article): string =>
  a.data.article_summary ?? a.data.description ?? '';

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

/** Latest industry reports, alphabetical by title. */
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

/** Section title without the "AI in " prefix the agent uses, e.g. "Healthcare". */
export const shortTitle = (title: string) => title.replace(/^AI in\s+/i, '');

const NZ = 'Pacific/Auckland';

const longDate = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: NZ,
});

const monthYear = new Intl.DateTimeFormat('en-NZ', {
  month: 'long',
  year: 'numeric',
  timeZone: NZ,
});

const dayOfMonth = new Intl.DateTimeFormat('en-NZ', { day: 'numeric', timeZone: NZ });
const monthShort = new Intl.DateTimeFormat('en-NZ', { month: 'short', timeZone: NZ });
const isoMonth = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: NZ });

export const formatDate = (date: Date) => longDate.format(date);
export const formatMonthYear = (date: Date) => monthYear.format(date);

export interface ArchiveMonth {
  key: string;
  label: string;
  year: string;
}

export interface ArchiveRow {
  title: string;
  permalink: string;
  cells: Record<string, { day: string; permalink: string; latest: boolean; label: string }[]>;
}

/**
 * Every edition laid out as a grid: one row per series (snapshot first, then
 * reports A–Z), one column per calendar month that has any edition, newest first.
 */
export async function getEditionArchive(): Promise<{ months: ArchiveMonth[]; rows: ArchiveRow[] }> {
  const all = await getAllArticles();
  const snapshot = await getLatestSnapshot();
  const series = [...(snapshot ? [snapshot] : []), ...(await getIndustryReports())];

  const months = new Map<string, ArchiveMonth>();
  for (const a of all) {
    const date = a.data.article_updated_at;
    const key = isoMonth.format(date);
    months.set(key, { key, label: monthShort.format(date), year: key.slice(0, 4) });
  }

  const rows = series.map((latest) => {
    const editions = all
      .filter((a) => a.data.article_series === latest.data.article_series)
      .sort((a, b) => a.data.article_updated_at.getTime() - b.data.article_updated_at.getTime());
    const cells: ArchiveRow['cells'] = {};
    for (const e of editions) {
      const date = e.data.article_updated_at;
      (cells[isoMonth.format(date)] ??= []).push({
        day: dayOfMonth.format(date),
        permalink: e.data.permalink,
        latest: e.data.article_latest,
        label: `${shortTitle(latest.data.title)}, ${formatDate(date)}`,
      });
    }
    return { title: shortTitle(latest.data.title), permalink: latest.data.permalink, cells };
  });

  return {
    months: [...months.values()].sort((a, b) => b.key.localeCompare(a.key)),
    rows,
  };
}
