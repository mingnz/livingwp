import { openai } from '@ai-sdk/openai';
import { tool, type Tool } from 'ai';
import { z } from 'zod';

export type FilenameUrls = Record<string, { title?: string; url?: string }>;

/**
 * Look up the OpenAI vector store ID for a given store name.
 * Vector stores are an OpenAI-hosted feature, so this tool is only
 * available when the article's model runs on OpenAI.
 */
export async function getStoreId(name: string): Promise<string | null> {
  const apiKey = process.env['OPENAI_API_KEY'];
  let after: string | undefined;

  do {
    const url = new URL('https://api.openai.com/v1/vector_stores');
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      console.warn(`Vector store listing failed: ${response.status}`);
      return null;
    }

    const payload = (await response.json()) as {
      data: { id: string; name?: string }[];
      has_more: boolean;
      last_id?: string;
    };
    for (const store of payload.data) {
      if (store.name === name) {
        console.log(`Found store id ${store.id} for ${name} store`);
        return store.id;
      }
    }
    after = payload.has_more ? payload.last_id : undefined;
  } while (after);

  console.warn(`Could not find a store with the name ${name}`);
  return null;
}

/** File search tool for the named OpenAI vector store, or null if not found. */
export async function getFileSearchTool(fileStoreName: string): Promise<Tool | null> {
  const storeId = await getStoreId(fileStoreName);
  if (!storeId) return null;
  return openai.tools.fileSearch({ vectorStoreIds: [storeId] });
}

/** Function tool converting filenames returned by file search into markdown links. */
export function getFileLinkTool(filenameUrls: FilenameUrls): Tool {
  return tool({
    description:
      'Provides a markdown link for a file name returned by the file search tool, if one is available. Use this tool to include a markdown link in place of every reference to a file in the output.',
    inputSchema: z.object({
      filename: z
        .string()
        .describe('The name of the file including any extensions'),
    }),
    execute: async ({ filename }) => {
      console.log(`Link requested for filename: ${filename}`);
      const fileDetails = filenameUrls[filename];
      if (!fileDetails) {
        console.warn(`No link found for ${filename}`);
        // "null" as a string gives more consistent model behaviour than an
        // empty string (carried over from the Python implementation).
        return 'null';
      }
      const result = `[${fileDetails.title}](${fileDetails.url})`;
      console.log(`Returning link: ${result}`);
      return result;
    },
  });
}
