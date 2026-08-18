import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import {
  ToolLoopAgent,
  isStepCount,
  type LanguageModel,
  type StepResult,
  type ToolSet,
} from 'ai';
import type { ProviderOptions } from '@ai-sdk/provider-utils';
import { getFileLinkTool, getFileSearchTool } from './fileSearch.js';
import { loadInstruction, type IndustryConfig } from './files.js';

export const DEFAULT_MODEL_NAME =
  process.env['RESEARCH_MODEL'] ?? 'gpt-5.4-2026-03-05';
export const DEFAULT_INSTRUCTIONS_FILENAME =
  process.env['RESEARCH_INSTRUCTIONS_FILENAME'] ?? 'instructions_research.md';
export const STREAMING_ENABLED =
  (process.env['STREAMING_ENABLED'] ?? 'True') === 'True';

export interface ResearchResult {
  text: string;
  finishReason: Awaited<ReturnType<ToolLoopAgent['generate']>>['finishReason'];
  steps: StepResult<ToolSet>[];
  totalUsage: Awaited<ReturnType<ToolLoopAgent['generate']>>['totalUsage'];
}

interface ResolvedModel {
  provider: 'openai' | 'anthropic' | 'google';
  model: LanguageModel;
  /** Provider-hosted web search: each provider exposes its own tool. */
  searchTools: ToolSet;
  providerOptions?: ProviderOptions;
}

/**
 * Resolve a model name to a provider, model instance, and that provider's
 * hosted web-search tool. Bare model names (e.g. "gpt-5.4-2026-03-05")
 * default to OpenAI for backwards compatibility with existing config;
 * "anthropic/..." and "google/..." prefixes select other providers.
 */
export function resolveModel(modelName: string): ResolvedModel {
  const [prefix, rest] = modelName.includes('/')
    ? [modelName.slice(0, modelName.indexOf('/')), modelName.slice(modelName.indexOf('/') + 1)]
    : ['openai', modelName];

  switch (prefix) {
    case 'openai':
      return {
        provider: 'openai',
        model: openai(rest),
        searchTools: { web_search: openai.tools.webSearch() },
        // Keep GPT-5 behaviour explicit so output shape stays stable.
        providerOptions: {
          openai: { reasoningEffort: 'medium', textVerbosity: 'medium' },
        },
      };
    case 'anthropic':
      return {
        provider: 'anthropic',
        model: anthropic(rest),
        searchTools: { web_search: anthropic.tools.webSearch_20250305({ maxUses: 20 }) },
      };
    case 'google':
      return {
        provider: 'google',
        model: google(rest),
        searchTools: { google_search: google.tools.googleSearch({}) },
      };
    default:
      throw new Error(
        `Unknown model provider "${prefix}" in "${modelName}". Use "openai/...", "anthropic/...", "google/...", or a bare OpenAI model name.`,
      );
  }
}

/** Tool names that count as a web search for usage reporting. */
export const WEB_SEARCH_TOOL_NAMES = new Set(['web_search', 'google_search']);

/** Create the research agent for an industry using config or defaults. */
export async function getResearchAgent(
  industryName: string,
  config: IndustryConfig = {},
): Promise<{ agent: ToolLoopAgent; modelName: string }> {
  // Per-article config wins over the RESEARCH_MODEL default, so only set
  // research_model when an article must be pinned to a specific model.
  const modelName = config.research_model ?? DEFAULT_MODEL_NAME;
  const { provider, model, searchTools, providerOptions } = resolveModel(modelName);

  const tools: ToolSet = { ...searchTools };
  // File search uses OpenAI-hosted vector stores, so it is OpenAI-only.
  if (config.file_store_name) {
    if (provider !== 'openai') {
      console.warn(
        `file_store_name is configured for ${industryName} but file search requires an OpenAI model; skipping.`,
      );
    } else {
      const fileSearchTool = await getFileSearchTool(config.file_store_name);
      if (fileSearchTool) {
        tools['file_search'] = fileSearchTool;
        if (config.filename_urls && Object.keys(config.filename_urls).length > 0) {
          tools['filename_to_link_converter'] = getFileLinkTool(config.filename_urls);
        }
      }
    }
  }

  const agent = new ToolLoopAgent({
    model,
    instructions: loadInstruction(
      config.instructions_filename ?? DEFAULT_INSTRUCTIONS_FILENAME,
    ),
    tools,
    stopWhen: isStepCount(30),
    ...(providerOptions ? { providerOptions } : {}),
  });

  return { agent, modelName };
}

function logToolCall(toolName: string, input: unknown): void {
  if (WEB_SEARCH_TOOL_NAMES.has(toolName)) {
    const query =
      (input as { query?: string; action?: { query?: string } } | undefined)?.query ??
      (input as { action?: { query?: string } } | undefined)?.action?.query;
    console.log(`[Web search] query=${JSON.stringify(query ?? input)}`);
  } else if (toolName === 'file_search') {
    console.log(`[File search] input=${JSON.stringify(input)}`);
  }
}

export async function performResearch(
  topic: string,
  agent: ToolLoopAgent,
  initialInput: string,
): Promise<ResearchResult> {
  if (STREAMING_ENABLED) {
    console.log(`Researching: ${topic}`);
    const result = await agent.stream({ prompt: initialInput });
    for await (const part of result.stream) {
      if (part.type === 'tool-call') {
        logToolCall(part.toolName, part.input);
      }
    }
    // Stream is complete → the result promises are now populated.
    return {
      text: await result.text,
      finishReason: await result.finishReason,
      steps: await result.steps,
      totalUsage: await result.totalUsage,
    };
  }

  console.log(`Researching: ${topic} (Streaming Disabled)`);
  const result = await agent.generate({ prompt: initialInput });
  return {
    text: result.text,
    finishReason: result.finishReason,
    steps: result.steps,
    totalUsage: result.totalUsage,
  };
}
