import matter from 'gray-matter';
import { dump, type DumpOptions } from 'js-yaml';

export type FrontMatter = Record<string, unknown>;

/** Parse a markdown document with YAML frontmatter into (metadata, body). */
export function parseMarkdown(text: string): [FrontMatter, string] {
  const { data, content } = matter(text);
  return [data, content.replace(/^\n/, '')];
}

/**
 * Combine metadata and body into a markdown document with YAML frontmatter.
 *
 * Matches the output conventions of python-frontmatter, which wrote all
 * existing content: alphabetically sorted keys, ~80 column wrapping, and no
 * trailing newline after the body.
 */
export function formatMarkdown(metadata: FrontMatter, body: string): string {
  const frontMatter = dump(metadata, {
    sortKeys: true,
    lineWidth: 80,
    allowUnicode: true,
  } as DumpOptions);
  return `---\n${frontMatter}---\n\n${body.trim()}`;
}
