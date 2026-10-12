/**
 * schema.org JSON-LD helpers. The Organization and WebSite nodes are emitted
 * sitewide (Base.astro); Article nodes reference them by @id so search engines
 * and AI crawlers resolve a single connected entity graph.
 */
import { GITHUB_URL, ORG_URL, PUBLISHER_NAME, SITE_TITLE } from './site';

const ref = (site: URL, hash: string) => new URL(hash, site).href;

export const ORG_ID = '/#org';
export const WEBSITE_ID = '/#website';

export function organizationNode(site: URL): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': ref(site, ORG_ID),
    name: PUBLISHER_NAME,
    url: ORG_URL,
    sameAs: [GITHUB_URL],
  };
}

export function webSiteNode(site: URL): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': ref(site, WEBSITE_ID),
    name: SITE_TITLE,
    url: new URL('/', site).href,
    inLanguage: 'en-NZ',
    publisher: { '@id': ref(site, ORG_ID) },
  };
}

/** An Article node for a published report, referencing the sitewide org/website. */
export function articleNode(
  site: URL,
  opts: {
    url: URL;
    headline: string;
    description: string;
    datePublished: Date;
    dateModified: Date;
    image: URL;
  },
): Record<string, unknown> {
  return {
    '@type': 'Article',
    '@id': `${opts.url.href}#article`,
    headline: opts.headline,
    description: opts.description,
    datePublished: opts.datePublished.toISOString(),
    dateModified: opts.dateModified.toISOString(),
    inLanguage: 'en-NZ',
    isAccessibleForFree: true,
    url: opts.url.href,
    mainEntityOfPage: opts.url.href,
    image: opts.image.href,
    author: { '@id': ref(site, ORG_ID) },
    publisher: { '@id': ref(site, ORG_ID) },
    isPartOf: { '@id': ref(site, WEBSITE_ID) },
  };
}
