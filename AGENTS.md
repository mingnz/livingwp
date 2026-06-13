# Repository Guide

This repository has two coupled halves:

- `src/livingwp`: Python code that runs the research/update pipeline.
- `src/website`: Astro site that renders the generated markdown and deploys to GitHub Pages.

The important maintenance rule is that article content is not just website copy. It is generated output with metadata conventions that the Python updater and the Astro content collection both depend on.

When adding features, changing workflows, or updating the architecture, update this `AGENTS.md` file in the same change whenever the guidance here is no longer accurate.

## Architecture

### Python updater

- Entry point: `uv run livingwp`
- CLI entry: `src/livingwp/__init__.py`
- Main pipeline: `src/livingwp/agents.py`
- Storage/front matter helpers: `src/livingwp/utils/files.py`
- Markdown parsing/serialization: `src/livingwp/utils/markdown.py`
- Usage/cost reporting helpers: `src/livingwp/utils/usage.py`
- Article config: `src/livingwp/config/industries.json`
- Default research prompt: `src/livingwp/prompts/instructions_research.md`
- NZ snapshot prompt: `src/livingwp/prompts/instructions_research_nz_snapshot.md`

Runtime flow:

1. Load article definitions from `industries.json`.
2. For each configured article slug, load the current latest article from `src/website/whitepaper/content/<slug>.md`.
3. Pass the existing article body into the OpenAI Agents research pipeline as context.
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
2. Routes are generated from the `permalink` frontmatter field (never from file paths), so latest pages keep stable permalinks like `/whitepaper/healthcare/` and `/whitepaper/nz/`.
3. Archived snapshots use dated permalinks like `/whitepaper/healthcare/2026-03-09-140533/`.
4. The homepage and `/whitepaper/` page feature the latest page with `article_kind: snapshot` separately from industry reports.
5. The article page builds the edition history timeline by collecting entries that share `article_series`.

## Article Metadata Contract

These front matter fields are now part of the contract between the updater and the site:

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
- `article_kind: snapshot` is used for the New Zealand national snapshot; pages without it are treated as industry articles by the list templates.
- `article_summary` is extracted from the article body and is used by the snapshot feature card.
- `article_series` must match the article slug and is how the layout groups history entries.
- `article_updated_at` is written in ISO 8601 and is used for display and ordering.

Note: `layout: article` is still written by the updater for backwards compatibility but is inert — Astro ignores it.

If you change any of these names or meanings, update both:

- `src/livingwp/utils/files.py`
- `src/website/src/content.config.ts` (and any components reading the field)

## Development Commands

Python:

```sh
uv sync
uv run livingwp
uv run livingwp healthcare
uv run python -m compileall src/livingwp
```

Website:

```sh
cd src/website
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

Notes:

- GitHub Actions builds the site with Node `22` and `npm ci`, so keep `package-lock.json` committed and in sync.

## GitHub Actions

### `.github/workflows/run_agent.yml`

- Manual or reusable workflow for article updates.
- Runs `uv run livingwp`.
- Creates a PR automatically when content changes.
- If invoked with `branch_name`, it commits directly onto that branch instead of opening a new PR.
- After generation finishes, it resolves the PR number, finds any existing usage comment by marker, and upserts the markdown comment body generated by Python using `peter-evans/find-comment@v4` and `peter-evans/create-or-update-comment@v5`.
- Requires `OPENAI_API_KEY` to be available as a GitHub Actions secret. Reusable callers must pass that secret through.
- Autogenerated PR titles and commits use conventional-commit style, with `chore:` for article refreshes.
- PR titles may include a leading emoji after the conventional prefix for readability in GitHub UI, but commit messages should remain plain conventional text.

### `.github/workflows/add_industry.yml`

- Adds a new industry to `industries.json`.
- Opens a PR for the config change.
- Then calls `run_agent.yml` to generate the initial article on the same branch.
- Inherits repository secrets when calling `run_agent.yml` so the OpenAI-backed article generation step can authenticate.
- The autogenerated PR title and commit use conventional-commit style, with `feat:` for the new industry addition.

### `.github/workflows/deploy_website.yml`

- Triggers on pushes to `main` that touch `src/website/**`.
- Builds the Astro site (`npm ci && npm run build`) and deploys `dist/` to GitHub Pages.

## Maintenance Notes

### Adding or changing industries

- Add industries through `src/livingwp/config/industries.json` or the `Add Industry` workflow.
- The industry key becomes the page slug and the `article_series` value.
- Keep keys stable. Renaming an industry slug changes URLs and separates old archives from new ones unless you migrate content deliberately.
- Special non-industry articles can also live in `industries.json`; the current example is `nz`, which is rendered separately via `article_kind: snapshot`.

### Working on article generation

- The updater always passes the previous latest article body into the model.
- When `history_context_count` is configured, the updater also passes recent archive excerpts; the `nz` snapshot uses this to compare month-on-month trends.
- The update pipeline archives the outgoing latest page before writing the new latest page.
- Archive filenames are timestamp-based in `Pacific/Auckland`.
- Usage reporting is based on `openai-agents` response usage plus counted `web_search_call` tool invocations. Cost is an estimate, not a billing export.

### Working on the article layout

- `src/website/src/components/SnapshotFeature.astro` renders the latest national snapshot on the homepage and article index.
- `src/website/src/components/ArticleIndex.astro` should list only latest non-snapshot pages.
- The edition history timeline is generated dynamically from frontmatter. There is no separate data file.
- Archived pages must remain inside the content collection glob. Do not exclude `src/website/whitepaper/content/archive`.

### Content expectations

- Latest articles can be rewritten heavily by the model, so do not assume section headings stay stable between runs.
- If you need durable structure for the site chrome, use front matter fields or layout logic, not regexes against article body text.

### Known quirks

- `src/livingwp/__init__.py` accepts a single optional `article_filter` string, but the README still shows a space-separated multi-argument example. The implementation currently expects a comma-separated string when filtering multiple industries.
- `src/livingwp/agents.py` imports `Agent`, `Runner`, and `WebSearchTool` from `agents`, which is correct for the current dependency layout. Re-check this import path if the OpenAI Agents SDK changes.
- Content files use the `.md` extension (required by Astro's content layer). The updater writes `.md` — see the extension literals in `src/livingwp/utils/files.py`.

## Safe Change Patterns

- If you change article persistence rules, test both the latest page and an archived snapshot.
- If you change front matter generation, inspect the rendered HTML for one latest page and one archive page.
- If you change workflows, verify whether the result should open a PR or commit onto an existing branch.
- Prefer small commits that separate infrastructure changes from generated article content updates.

## Suggested Verification

For Python-side changes:

```sh
uv run python -m compileall src/livingwp
```

For website changes:

```sh
cd src/website
npm run build
npm run dev
```

For end-to-end article history checks:

1. Run a single-article update.
2. Confirm the latest page was rewritten.
3. Confirm a dated archive file was created under `src/website/whitepaper/content/archive/<slug>/`.
4. Open the article page and verify the history list links to the archive snapshot.
