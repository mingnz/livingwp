import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getLatestArticles, summaryOf } from '../lib/articles';
import { SITE_DESCRIPTION, SITE_TITLE } from '../lib/site';

export async function GET(context: APIContext) {
  const articles = (await getLatestArticles()).sort(
    (a, b) =>
      b.data.article_updated_at.getTime() - a.data.article_updated_at.getTime(),
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: articles.map((article) => ({
      title: article.data.title,
      link: article.data.permalink,
      pubDate: article.data.article_updated_at,
      description: summaryOf(article),
    })),
  });
}
