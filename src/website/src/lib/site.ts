/** Sitewide names and links, shared by the layout, pages, SEO and feeds. */

export const SITE_TITLE = 'AI in NZ Living Whitepaper';
export const SITE_NAME = 'Living Whitepaper';
export const SITE_DESCRIPTION =
  'A living record of AI adoption across Aotearoa New Zealand, researched and published monthly by an AI agent.';

export const WORKING_GROUP = 'Agentic AI Working Group';
export const ORG_NAME = 'AI Forum New Zealand';
export const ORG_NAME_MI = 'Te Kāhui Atamai Iahiko o Aotearoa';
export const ORG_URL = 'https://aiforum.org.nz';
export const PUBLISHER_NAME = `${ORG_NAME} — ${WORKING_GROUP}`;

export const GITHUB_URL = 'https://github.com/mingnz/livingwp';

/** New GitHub issue from the article-feedback form, optionally pre-filled. */
export function feedbackUrl(prefill?: { title: string; articleUrl: string }): string {
  const params = new URLSearchParams({ template: 'article-feedback.yml' });
  if (prefill) {
    params.set('title', prefill.title);
    params.set('article-url', prefill.articleUrl);
  }
  return `${GITHUB_URL}/issues/new?${params}`;
}
