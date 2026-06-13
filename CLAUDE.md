# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Living Whitepaper tracks AI adoption across industries in Aotearoa New Zealand. It combines a Python agent (OpenAI Agents SDK + web search) that conducts research with an Astro static site that publishes the findings. GitHub Actions orchestrate automated article updates and deployment.

## Commands

### Python Agent
```bash
uv sync                                      # Install dependencies
uv run livingwp                               # Run agent for all industries
uv run livingwp healthcare                    # Run for specific industry
uv run livingwp healthcare,education          # Multiple industries (comma-separated)
uv run python -m compileall src/livingwp      # Verify Python syntax (no test suite)
```

### Website (Astro)
```bash
cd src/website
npm install
npm run dev      # Local dev server (http://localhost:4321)
npm run build    # Production build to dist/
```

### Linting
```bash
uv run ruff check src/      # Lint Python code
uv run ruff format src/     # Format Python code
```

## Architecture

### Two-Part System

1. **Python agent** (`src/livingwp/`) — Reads industry config, loads the current article, runs an OpenAI research agent with web search, archives the old article, and saves the new one.
2. **Astro website** (`src/website/`) — Static site (Astro 5 + Tailwind v4) that renders articles from markdown files with YAML frontmatter via a content collection. Deployed to GitHub Pages on push to main.

The two halves share only the markdown files and their frontmatter contract — neither invokes the other.

### Core Data Flow

Industries are defined in `src/livingwp/config/industries.json`. For each industry, the agent:
1. Loads the current article from `src/website/whitepaper/content/<industry>.md`
2. Runs a research agent (model + prompt from config) with the previous article as context
3. Archives the old article to `src/website/whitepaper/content/archive/<industry>/<timestamp>.md`
4. Overwrites the latest article at the stable URL path

### Article Metadata Contract

Every article requires these frontmatter fields (written by `normalize_article_metadata()` in `utils/files.py`, validated by the Zod schema in `src/website/src/content.config.ts`):

- `layout: article` — Inert legacy field (kept for compatibility; Astro ignores it)
- `article: true/false` — `true` for latest (shown in index), `false` for archived
- `article_latest: true/false` — Controls edition timeline highlighting
- `article_version: true/false` — `true` for archived versions
- `article_history: true` — Enables edition history
- `article_series: <industry>` — Groups articles for history navigation
- `article_updated_at` — ISO 8601 timestamp in Pacific/Auckland timezone
- `permalink` — Stable URL for latest, timestamped URL for archives. **Routes are generated from this field, never from file paths.**

### Key Files

- `src/livingwp/__init__.py` — CLI entry point, parses args, calls `update_articles()`
- `src/livingwp/agents.py` — Agent creation, research execution, article update loop
- `src/livingwp/utils/files.py` — File I/O, archiving, metadata normalization, industry config
- `src/livingwp/utils/markdown.py` — YAML frontmatter parsing/serialization
- `src/livingwp/prompts/instructions_research.md` — Research agent prompt template
- `src/website/src/content.config.ts` — Content collection + frontmatter schema (Zod)
- `src/website/src/pages/[...slug].astro` — Article page (routes from permalinks, edition timeline)
- `src/website/src/lib/articles.ts` — Collection query helpers (latest/snapshot/history)
- `src/website/src/styles/global.css` — Tailwind v4 theme tokens + article prose styles

### GitHub Actions Workflows

- `run_agent.yml` — Runs the agent and opens a PR with updated articles
- `add_industry.yml` — Adds a new industry to config and generates its first article
- `deploy_website.yml` — Builds the Astro site (Node 22, `npm ci && npm run build`) and deploys to GitHub Pages (triggers on `src/website/**` changes to main)

## Key Conventions

- **Package manager**: `uv` for Python, npm for the website
- **Timezone**: All article timestamps use Pacific/Auckland
- **Archive immutability**: Archived articles are never modified; new versions create new files
- **No post-processing**: Agent output is publication-ready markdown written directly to files
- **Industry config-driven**: Adding industries requires no code changes — only `industries.json` updates
- **Content extension**: Article files are `.md` (required by Astro's content layer); the agent writes `.md` too
