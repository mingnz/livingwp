// @ts-check
/**
 * Sätteri hast plugin for agent-written articles.
 *
 * 1. Removes the body's leading `# Title` and the summary paragraph after it.
 *    The page header already shows both from frontmatter.
 * 2. Rewrites inline citations, `([domain](url))` or a short named source such
 *    as `([AWS case study](url))`, into a link with the `source-chip` class,
 *    dropping the parentheses and any `www.` prefix.
 */

const DOMAIN_TEXT = /^(?:www\.)?[\w-]+(?:\.[\w-]+)+$/i;
/** Longest link text still treated as a source name rather than prose. */
const MAX_SOURCE_NAME = 48;

/** @param {string} text */
const isSourceText = (text) => DOMAIN_TEXT.test(text) || text.trim().length <= MAX_SOURCE_NAME;

/** @param {string} s */
const normalise = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Whether `children[i]` is a citation link: an `<a>` whose text is a domain or
 * short source name, directly wrapped in "(" and ")".
 * @param {readonly any[]} children @param {number} i @param {(n: any) => string} textOf
 */
function isCitation(children, i, textOf) {
  const [before, link, after] = [children[i - 1], children[i], children[i + 1]];
  return (
    link?.type === 'element' &&
    link.tagName === 'a' &&
    before?.type === 'text' &&
    after?.type === 'text' &&
    before.value.endsWith('(') &&
    after.value.startsWith(')') &&
    isSourceText(textOf(link))
  );
}

/**
 * The text at `children[j]` with citation parentheses removed. Depends only on
 * its neighbours, so two citations sharing one text node (") and (") compute
 * the same result whichever is visited first.
 * @param {readonly any[]} children @param {number} j @param {(n: any) => string} textOf
 */
function stripParens(children, j, textOf) {
  let value = children[j].value;
  if (isCitation(children, j - 1, textOf)) value = value.slice(1);
  if (isCitation(children, j + 1, textOf)) value = value.slice(0, -1);
  return value;
}

/**
 * Root-level indexes of the leading title and summary paragraph to remove, if
 * the document starts with an h1 (and, for the summary, a paragraph whose text
 * matches the frontmatter summary).
 * @param {import('satteri').HastVisitorContext} ctx @param {readonly any[]} rootChildren
 * @returns {number[]}
 */
function leadIndexes(ctx, rootChildren) {
  const [title, next] = rootChildren.flatMap((n, i) => (n.type === 'element' ? [i] : []));
  if (title === undefined || rootChildren[title].tagName !== 'h1') return [];

  const astro = /** @type {{ frontmatter?: Record<string, unknown> } | undefined} */ (ctx.data.astro);
  const summary = astro?.frontmatter?.article_summary;
  const para = next === undefined ? undefined : rootChildren[next];
  const isSummary =
    para?.tagName === 'p' &&
    typeof summary === 'string' &&
    normalise(ctx.textContent(para)) === normalise(summary);
  return isSummary ? [title, next] : [title];
}

/** @type {import('satteri').HastPluginDefinition} */
export const articlePlugin = {
  name: 'living-article',
  element: [
    {
      filter: ['h1'],
      visit(node, ctx) {
        const parent = ctx.parent(node);
        const index = ctx.indexOf(node);
        if (parent?.type !== 'root' || index === undefined) return;
        const lead = leadIndexes(ctx, parent.children);
        if (lead[0] !== index) return;
        for (const i of lead) ctx.removeNode(parent.children[i]);
      },
    },
    {
      filter: ['a'],
      visit(node, ctx) {
        const parent = ctx.parent(node);
        const index = ctx.indexOf(node);
        if (!parent || index === undefined) return;
        const children = parent.children;
        const textOf = (/** @type {any} */ n) => ctx.textContent(n);
        if (!isCitation(children, index, textOf)) return;

        // Skip links inside the summary paragraph, which the h1 visitor removes.
        const grandparent = ctx.parent(parent);
        if (grandparent?.type === 'root') {
          const paraIndex = ctx.indexOf(parent);
          if (paraIndex !== undefined && leadIndexes(ctx, grandparent.children).includes(paraIndex)) return;
        }

        const text = textOf(node);
        // Each text node is rewritten once: by the citation on its left when
        // there is one, else by the citation on its right.
        const texts = isCitation(children, index - 2, textOf) ? [index + 1] : [index - 1, index + 1];
        for (const j of texts) {
          ctx.replaceNode(children[j], { type: 'text', value: stripParens(children, j, textOf) });
        }
        ctx.replaceNode(node, {
          type: 'element',
          tagName: 'a',
          properties: { ...node.properties, className: ['source-chip'] },
          children: [{ type: 'text', value: DOMAIN_TEXT.test(text) ? text.replace(/^www\./i, '') : text }],
        });
      },
    },
  ],
};
