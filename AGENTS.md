# Repository Guide

This repository has three coupled parts:

- `src/agent`: TypeScript code that runs the research/update pipeline (Vercel AI SDK).
- `src/website`: Astro site that renders the generated markdown and deploys to GitHub Pages.
- `packages/article-contract`: the shared frontmatter contract both of the above depend on.

This is an npm-workspaces monorepo: `npm install`/`npm ci` runs at the repo root against a single root lockfile, and all three workflows install that way.

Article content is not just website copy. It is generated output whose metadata conventions are defined once in `packages/article-contract` and enforced at both ends: the agent validates its output against the contract, and the Astro content collection builds its read schema from the same definition.

When adding features, changing workflows, or updating the architecture, update this `AGENTS.md` file in the same change whenever the guidance here is no longer accurate.

## Architecture

### Agent updater

- Entry point: `npm run agent` (from the repo root) or `npm start -w livingwp-agent`
- CLI entry: `src/agent/src/cli.ts`
- Update loop + research input building: `src/agent/src/update.ts`
- Agent creation, provider resolution, research execution: `src/agent/src/agent.ts`
- Storage/front matter helpers: `src/agent/src/files.ts`
- Markdown parsing/serialization: `src/agent/src/markdown.ts`
- File search (OpenAI vector stores): `src/agent/src/fileSearch.ts`
- Usage/cost reporting helpers: `src/agent/src/usage.ts`
- Article config: `src/agent/config/industries.json`
- Default research prompt: `src/agent/prompts/instructions_research.md`
- NZ snapshot prompt: `src/agent/prompts/instructions_research_nz_snapshot.md`

The agent uses the Vercel AI SDK's `ToolLoopAgent`. `resolveModel()` in `agent.ts` maps a model name to a provider and that provider's hosted web-search tool: bare names (e.g. `gpt-5.6-luna`) resolve to OpenAI; `anthropic/...` and `google/...` prefixes select those providers. To add a provider, add a case there.

Runtime flow:

1. Load article definitions from `industries.json`.
2. For each configured article slug, load the current latest article from `src/website/whitepaper/content/<slug>.md`.
3. Pass the existing article body into the `ToolLoopAgent` run as context.
4. If an article config sets `history_context_count`, also pass excerpts from recent archived versions into the research input.
5. Before writing the refreshed article, archive the outgoing latest page to `src/website/whitepaper/content/archive/<slug>/<timestamp>.md`.
6. Rewrite the stable latest page at `/whitepaper/<slug>/`.
7. When `LIVINGWP_USAGE_REPORT_PATH` is set, write a JSON usage report for the full run, including token totals, web search calls, and estimated cost.
8. When `LIVINGWP_USAGE_COMMENT_PATH` is set, write a markdown PR comment body for the full run, including a stable marker for comment updates.

### Website

- Site config: `src/website/astro.config.mjs`
- Content collection + frontmatter schema: `src/website/src/content.config.ts`
- Collection query helpers: `src/website/src/lib/articles.ts`
- Article route: `src/website/src/pages/[...slug].astro`
- Industry article list component: `src/website/src/components/ArticleIndex.astro`
- Snapshot feature component: `src/website/src/components/SnapshotFeature.astro`
- Edition history component: `src/website/src/components/EditionTimeline.astro`
- Site styles (Tailwind v4 theme + prose overrides): `src/website/src/styles/global.css`
- Latest article pages: `src/website/whitepaper/content/*.md`
- Archived article pages: `src/website/whitepaper/content/archive/<slug>/*.md`

Rendering flow:

1. The `articles` content collection globs every markdown file under `whitepaper/content` and validates frontmatter against the Zod schema in `content.config.ts`.
2. Routes are generated from the `permalink` frontmatter field, never from file paths, so latest pages keep stable permalinks like `/whitepaper/healthcare/` and `/whitepaper/nz/`.
3. Archived snapshots use dated permalinks like `/whitepaper/healthcare/2026-03-09-140533/`.
4. The homepage and `/whitepaper/` page feature the latest page with `article_kind: snapshot` separately from industry reports.
5. The article page builds the edition history timeline by collecting entries that share `article_series`.

## Article metadata contract

These front matter fields are part of the contract between the updater and the site:

- `layout: article`
- `title`
- `permalink`
- `article`
- `article_history`
- `article_latest`
- `article_kind`
- `article_summary`
- `article_version`
- `article_series`
- `article_updated_at`

Semantics:

- Latest pages must have `article: true`, `article_latest: true`, `article_version: false`.
- Archived pages must have `article: false`, `article_latest: false`, `article_version: true`.
- `article_kind: snapshot` is used for the New Zealand national snapshot. Pages without it are treated as industry articles by the list templates.
- `article_summary` is extracted from the article body and is used by the snapshot feature card.
- `article_series` must match the article slug and is how the layout groups history entries.
- `article_updated_at` is written in ISO 8601 and is used for display and ordering.

Note: `layout: article` is still written by the updater for backwards compatibility but is inert. Astro ignores it.

The field set is defined once in `packages/article-contract` (`articleFrontmatterShape`). To change the contract, edit that shape; the agent (`src/agent/src/files.ts`) and the site (`src/website/src/content.config.ts`) both build from it. Retired Jekyll fields (`layout`, `date`, `last_modified_at`) are no longer written. The site's read schema strips unknown keys, so immutable archives that still contain them stay valid.

## Development commands

Run everything from the repo root (npm workspaces):

```sh
npm install                       # installs all workspaces
npm run agent -- healthcare       # run the agent (omit arg = all industries)
npm run add-industry -- "Name"    # add an industry to industries.json
npm run typecheck                 # shared contract + agent
npm run dev:site                  # http://localhost:4321
npm run build:site                # outputs to src/website/dist/
```

A single workspace can also be driven directly, e.g. `npm start -w livingwp-agent -- healthcare`.

Notes:

- All three GitHub Actions workflows `npm ci` at the repo root with Node `22`. Keep the single root `package-lock.json` committed and in sync. Per-package lockfiles must not exist.
- The agent reads and writes content under `src/website/whitepaper/content`, resolved relative to the agent module location, so it works regardless of the current working directory.

## GitHub Actions

### `.github/workflows/run_agent.yml`

- Manual or reusable workflow for article updates.
- Runs `npm ci` then `npm run agent` from the repo root.
- Creates a PR automatically when content changes.
- If invoked with `branch_name`, it commits directly onto that branch instead of opening a new PR.
- After generation finishes, it resolves the PR number, finds any existing usage comment by marker, and upserts the markdown comment body generated by the agent using `peter-evans/find-comment@v4` and `peter-evans/create-or-update-comment@v5`.
- Requires at least one provider key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`) as a GitHub Actions secret, matching the providers referenced by configured `research_model` values. Reusable callers pass these through.
- Autogenerated PR titles and commits use conventional-commit style, with `chore:` for article refreshes.
- PR titles may include a leading emoji after the conventional prefix for readability in the GitHub UI, but commit messages must remain plain conventional text.

### `.github/workflows/add_industry.yml`

- Adds a new industry to `industries.json`.
- Opens a PR for the config change.
- Then calls `run_agent.yml` to generate the initial article on the same branch.
- Inherits repository secrets when calling `run_agent.yml` so the article generation step can authenticate with the configured provider.
- The autogenerated PR title and commit use conventional-commit style, with `feat:` for the new industry addition.

### `.github/workflows/deploy_website.yml`

- Triggers on pushes to `main` that touch `src/website/**`.
- Builds the Astro site (`npm ci` at root + `npm run build:site`) and deploys `src/website/dist/` to GitHub Pages.

## Maintenance notes

### Adding or changing industries

- Add industries through `src/agent/config/industries.json` or the `Add Industry` workflow.
- The industry key becomes the page slug and the `article_series` value.
- Keep keys stable. Renaming an industry slug changes URLs and separates old archives from new ones unless you migrate content deliberately.
- Special non-industry articles can also live in `industries.json`. The current example is `nz`, which is rendered separately via `article_kind: snapshot`.

### Working on article generation

- The updater always passes the previous latest article body into the model.
- When `history_context_count` is configured, the updater also passes recent archive excerpts. The `nz` snapshot uses this to compare month-on-month trends.
- The update pipeline archives the outgoing latest page before writing the new latest page.
- Archive filenames are timestamp-based in `Pacific/Auckland`.
- Usage reporting sums per-step token usage from the AI SDK (`result.totalUsage`) plus counted web-search tool calls. Cost is an estimate, not a billing export. Only models in `DEFAULT_MODEL_PRICING` (or supplied via `LIVINGWP_MODEL_PRICING_OVERRIDES_JSON`) get a price.

### Working on the article layout

- `src/website/src/components/SnapshotFeature.astro` renders the latest national snapshot on the homepage and article index.
- `src/website/src/components/ArticleIndex.astro` must list only latest non-snapshot pages.
- The edition history timeline is generated dynamically from frontmatter. There is no separate data file.
- Archived pages must remain inside the content collection glob. Do not exclude `src/website/whitepaper/content/archive`.

### Content expectations

- Latest articles can be rewritten heavily by the model, so do not assume section headings stay stable between runs.
- If you need durable structure for the site chrome, use front matter fields or layout logic, not regexes against article body text.

### Known quirks

- The CLI accepts a single optional `article_filter` argument. Pass multiple industries as a comma-separated string (e.g. `npm run agent -- finance,healthcare`).
- `@livingwp/article-contract` exports a factory (`articleFrontmatterShape(z)`) rather than a built schema, so the agent and Astro each build it with their own Zod instance. Passing a schema built by one Zod copy to another causes cross-instance failures. Keep it a factory.
- Web search is a provider-hosted tool, so it is not portable across providers. Each provider case in `resolveModel()` wires its own search tool. File search uses OpenAI vector stores and is OpenAI-only; configuring `file_store_name` on a non-OpenAI model logs a warning and is skipped.
- The AI SDK major version and the `@ai-sdk/*` provider packages must stay in lockstep (currently `ai@6` with providers at `^3`). Mismatched majors produce confusing `SharedV2`/`SharedV3` type errors.
- The TypeScript agent serializes frontmatter with js-yaml, which renders long strings (`article_summary`, `description`) as folded block scalars (`>-`) where python-frontmatter used plain/quoted style. The parsed values are identical and Astro validates both. Expect a one-time cosmetic reformat the first time each article is regenerated.
- Content files use the `.md` extension (required by Astro's content layer). The updater writes `.md` — see the extension literals in `src/agent/src/files.ts`.

## Safe change patterns

- If you change article persistence rules, test both the latest page and an archived snapshot.
- If you change front matter generation, inspect the rendered HTML for one latest page and one archive page.
- If you change workflows, verify whether the result should open a PR or commit onto an existing branch.
- Prefer small commits that separate infrastructure changes from generated article content updates.

## Suggested verification

For agent or contract changes (from the repo root):

```sh
npm run typecheck
```

For website changes (from the repo root):

```sh
npm run build:site
npm run dev:site
```

For end-to-end article history checks:

1. Run a single-article update.
2. Confirm the latest page was rewritten.
3. Confirm a dated archive file was created under `src/website/whitepaper/content/archive/<slug>/`.
4. Open the article page and verify the history list links to the archive snapshot.
