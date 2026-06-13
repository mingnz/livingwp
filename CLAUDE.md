# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Living Whitepaper tracks AI adoption across industries in Aotearoa New Zealand. It combines a TypeScript agent (Vercel AI SDK + provider-hosted web search) that conducts research with an Astro static site that publishes the findings. GitHub Actions orchestrate automated article updates and deployment.

## Commands

### Agent (TypeScript)
```bash
cd src/agent
npm install
npm start                              # Run agent for all industries
npm start -- healthcare                # Run for specific industry
npm start -- healthcare,education      # Multiple industries (comma-separated)
npm run add-industry -- "Logistics"    # Add an industry to industries.json
npm run typecheck                      # Verify types (no test suite)
```

### Website (Astro)
```bash
cd src/website
npm install
npm run dev      # Local dev server (http://localhost:4321)
npm run build    # Production build to dist/
```

## Architecture

### Two-Part System

1. **TypeScript agent** (`src/agent/`) — Reads industry config, loads the current article, runs a research agent (Vercel AI SDK `ToolLoopAgent`) with web search, archives the old article, and saves the new one.
2. **Astro website** (`src/website/`) — Static site (Astro 5 + Tailwind v4) that renders articles from markdown files with YAML frontmatter via a content collection. Deployed to GitHub Pages on push to main.

The two halves share only the markdown files and their frontmatter contract — neither invokes the other.

### Provider flexibility

The research model is set per-article in `industries.json` via `research_model`. Bare model names (e.g. `gpt-5.4-2026-03-05`) default to OpenAI; prefix with `anthropic/` or `google/` to use those providers. Web search is provider-hosted, so `resolveModel()` in `src/agent/src/agent.ts` maps each provider to its own search tool (`openai.tools.webSearch`, `anthropic.tools.webSearch_20250305`, `google.tools.googleSearch`). File search (OpenAI vector stores) is OpenAI-only.

### Core Data Flow

Industries are defined in `src/agent/config/industries.json`. For each industry, the agent:
1. Loads the current article from `src/website/whitepaper/content/<industry>.md`
2. Runs a research agent (model + prompt from config) with the previous article as context
3. Archives the old article to `src/website/whitepaper/content/archive/<industry>/<timestamp>.md`
4. Overwrites the latest article at the stable URL path

### Article Metadata Contract

Every article requires these frontmatter fields (written by `normalizeArticleMetadata()` in `src/agent/src/files.ts`, validated by the Zod schema in `src/website/src/content.config.ts`):

- `layout: article` — Inert legacy field (kept for compatibility; Astro ignores it)
- `article: true/false` — `true` for latest (shown in index), `false` for archived
- `article_latest: true/false` — Controls edition timeline highlighting
- `article_version: true/false` — `true` for archived versions
- `article_history: true` — Enables edition history
- `article_series: <industry>` — Groups articles for history navigation
- `article_updated_at` — ISO 8601 timestamp in Pacific/Auckland timezone
- `permalink` — Stable URL for latest, timestamped URL for archives. **Routes are generated from this field, never from file paths.**

### Key Files

- `src/agent/src/cli.ts` — CLI entry point, parses args, calls `updateArticles()`
- `src/agent/src/update.ts` — Research input building and article update loop
- `src/agent/src/agent.ts` — Agent creation, provider resolution, research execution
- `src/agent/src/files.ts` — File I/O, archiving, metadata normalization, industry config
- `src/agent/src/markdown.ts` — YAML frontmatter parsing/serialization (gray-matter + js-yaml)
- `src/agent/src/usage.ts` — Token usage and cost reporting
- `src/agent/prompts/instructions_research.md` — Research agent prompt template
- `src/website/src/content.config.ts` — Content collection + frontmatter schema (Zod)
- `src/website/src/pages/[...slug].astro` — Article page (routes from permalinks, edition timeline)
- `src/website/src/lib/articles.ts` — Collection query helpers (latest/snapshot/history)
- `src/website/src/styles/global.css` — Tailwind v4 theme tokens + article prose styles

### GitHub Actions Workflows

- `run_agent.yml` — Runs the agent and opens a PR with updated articles
- `add_industry.yml` — Adds a new industry to config and generates its first article
- `deploy_website.yml` — Builds the Astro site (Node 22, `npm ci && npm run build`) and deploys to GitHub Pages (triggers on `src/website/**` changes to main)

## Key Conventions

- **Package manager**: npm (both `src/agent` and `src/website`)
- **Timezone**: All article timestamps use Pacific/Auckland
- **Archive immutability**: Archived articles are never modified; new versions create new files
- **No post-processing**: Agent output is publication-ready markdown written directly to files
- **Industry config-driven**: Adding industries requires no code changes — only `industries.json` updates
- **Content extension**: Article files are `.md` (required by Astro's content layer); the agent writes `.md` too
