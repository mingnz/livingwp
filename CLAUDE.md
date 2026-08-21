# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Living Whitepaper tracks AI adoption across industries in Aotearoa New Zealand. It combines a TypeScript agent (Vercel AI SDK + provider-hosted web search) that conducts research with an Astro static site that publishes the findings. GitHub Actions orchestrate automated article updates and deployment.

## Commands

This is an npm-workspaces monorepo. Run `npm install` once at the repo root; it
installs all workspaces. The root scripts are the canonical entry points:

```bash
npm install                            # Install all workspaces (run at root)
npm run agent -- healthcare            # Run agent for an industry (omit arg = all)
npm run agent -- healthcare,education  # Multiple industries (comma-separated)
npm run add-industry -- "Logistics"    # Add an industry to industries.json
npm run typecheck                      # Typecheck the shared contract + agent
npm run dev:site                       # Website dev server (http://localhost:4321)
npm run build:site                     # Website production build to src/website/dist/
```

You can also run a workspace directly, e.g. `npm start -w livingwp-agent -- healthcare`.

## Architecture

### Workspaces

- **`src/agent`** (`livingwp-agent`) — the TypeScript research/update agent.
- **`src/website`** (`livingwp-website`) — the Astro 5 + Tailwind v4 site.
- **`packages/article-contract`** (`@livingwp/article-contract`) — the shared
  frontmatter contract (a Zod-shape factory) consumed by both above, so the
  field definitions can't drift between writer and reader.

### Two-Part System

1. **TypeScript agent** (`src/agent/`) — Reads industry config, loads the current article, runs a research agent (Vercel AI SDK `ToolLoopAgent`) with web search, archives the old article, and saves the new one.
2. **Astro website** (`src/website/`) — Static site that renders articles from markdown files with YAML frontmatter via a content collection. Deployed to GitHub Pages on push to main.

The two halves share only the markdown files and the `@livingwp/article-contract` schema — neither invokes the other.

### Provider flexibility

The research model defaults to the `RESEARCH_MODEL` environment variable (see `DEFAULT_MODEL_NAME` in `src/agent/src/agent.ts`), which CI sets from the `RESEARCH_MODEL` repository variable. An article can pin a different model in `industries.json` via `research_model`, which takes precedence over the environment variable; articles without the key follow it. Bare model names default to OpenAI; prefix with `anthropic/` or `google/` to use those providers. Docs and website copy don't name a specific model — they say "frontier model" so the copy doesn't go stale when `RESEARCH_MODEL` changes.

Reasoning effort follows the same pattern: `RESEARCH_REASONING_EFFORT` (default `medium`) sets `DEFAULT_REASONING_EFFORT`, and an article can pin `research_reasoning_effort` in `industries.json`. The shared scale is `minimal | low | medium | high | xhigh | max`; `resolveModel()` maps it onto each provider's own option (OpenAI `reasoningEffort`, Anthropic `effort`, Google `thinkingConfig.thinkingLevel`), clamping the ends that a provider doesn't support. An off-scale value throws rather than falling back to a default.

Web search is provider-hosted, so `resolveModel()` in `src/agent/src/agent.ts` maps each provider to its own search tool (`openai.tools.webSearch`, `anthropic.tools.webSearch_20250305`, `google.tools.googleSearch`). File search (OpenAI vector stores) is OpenAI-only.

### Core Data Flow

Industries are defined in `src/agent/config/industries.json`. For each industry, the agent:
1. Loads the current article from `src/website/whitepaper/content/<industry>.md`
2. Runs a research agent (model + prompt from config) with the previous article as context
3. Archives the old article to `src/website/whitepaper/content/archive/<industry>/<timestamp>.md`
4. Overwrites the latest article at the stable URL path

### Article Metadata Contract

The field set is defined **once** in `packages/article-contract` (`articleFrontmatterShape`). The agent builds a strict Zod schema from it and validates its output in `normalizeArticleMetadata()` (`src/agent/src/files.ts`) before writing; the Astro content collection (`src/website/src/content.config.ts`) builds its read schema from the same shape (adding string→Date coercion for `article_updated_at`). Change the contract in one place.

- `title`
- `permalink` — Stable URL for latest, timestamped URL for archives. **Routes are generated from this field, never from file paths.**
- `article: true/false` — `true` for latest (shown in index), `false` for archived
- `article_latest: true/false` — Controls edition timeline highlighting
- `article_version: true/false` — `true` for archived versions
- `article_history: true` — Enables edition history
- `article_series: <industry>` — Groups articles for history navigation
- `article_kind: industry|snapshot`
- `article_updated_at` — ISO 8601 timestamp in Pacific/Auckland timezone
- `article_summary`, `description` — extracted from the body

The agent writes exactly these fields. Retired Jekyll-era fields (`layout`, `date`, `last_modified_at`) are no longer written; the read schema strips unknown keys so older archives that still contain them stay valid.

### Key Files

- `src/agent/src/cli.ts` — CLI entry point, parses args, calls `updateArticles()`
- `src/agent/src/update.ts` — Research input building and article update loop
- `src/agent/src/agent.ts` — Agent creation, provider resolution, research execution
- `src/agent/src/files.ts` — File I/O, archiving, metadata normalization, industry config
- `src/agent/src/markdown.ts` — YAML frontmatter parsing/serialization (gray-matter + js-yaml)
- `src/agent/src/usage.ts` — Token usage and cost reporting
- `src/agent/prompts/instructions_research.md` — Research agent prompt template
- `packages/article-contract/src/index.ts` — Shared frontmatter contract (single source of truth)
- `src/website/src/content.config.ts` — Content collection; builds its schema from the shared contract
- `src/website/src/pages/[...slug].astro` — Article page (routes from permalinks, edition timeline)
- `src/website/src/lib/articles.ts` — Collection query helpers (latest/snapshot/history)
- `src/website/src/styles/global.css` — Tailwind v4 theme tokens + article prose styles

### GitHub Actions Workflows

- `run_agent.yml` — Runs the agent monthly (cron `23 1 1 * *`) or on demand, opens a PR with updated articles, then auto-merges it and dispatches the website deploy (manual runs can opt out via the `auto_merge` input). The merged PR + usage comment + run logs are the audit trail; there is no human review gate.
- `add_industry.yml` — Adds a new industry to config and generates its first article
- `deploy_website.yml` — Builds the Astro site (Node 22, `npm ci` at root + `npm run build:site`) and deploys to GitHub Pages (triggers on `src/website/**` changes to main)

All workflows `npm ci` at the repo root (workspaces share one lockfile).

## Key Conventions

- **Package manager**: npm workspaces (root install; `src/agent`, `src/website`, `packages/*`)
- **Timezone**: All article timestamps use Pacific/Auckland
- **Archive immutability**: Archived articles are never modified; new versions create new files
- **No post-processing**: Agent output is publication-ready markdown written directly to files
- **Industry config-driven**: Adding industries requires no code changes — only `industries.json` updates
- **Content extension**: Article files are `.md` (required by Astro's content layer); the agent writes `.md` too
