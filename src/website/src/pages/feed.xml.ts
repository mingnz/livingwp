import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getLatestArticles } from '../lib/articles';

export async function GET(context: APIContext) {
  const articles = (await getLatestArticles()).sort(
    (a, b) =>
      b.data.article_updated_at.getTime() - a.data.article_updated_at.getTime(),
  );

  return rss({
    title: 'AI in NZ Living Whitepaper',
    description:
      'A living record of generative AI adoption across Aotearoa New Zealand, researched and published monthly by an AI agent.',
    site: context.site!,
    items: articles.map((article) => ({
      title: article.data.title,
      link: article.data.permalink,
      pubDate: article.data.article_updated_at,
      description:
        article.data.article_summary ?? article.data.description ?? '',
    })),
  });
}
