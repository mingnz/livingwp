# Living Whitepaper

[![Update whitepapers](https://github.com/mingnz/livingwp/actions/workflows/run_agent.yml/badge.svg)](https://github.com/mingnz/livingwp/actions/workflows/run_agent.yml)
[![Deploy website to Github Pages](https://github.com/mingnz/livingwp/actions/workflows/deploy_website.yml/badge.svg)](https://github.com/mingnz/livingwp/actions/workflows/deploy_website.yml)

An open source experiment tracking how generative AI is used across Aotearoa
New Zealand. The site publishes a monthly national "State of AI in New Zealand"
snapshot alongside sector-specific living articles. The whole pipeline is
autonomous: at the start of each month a GitHub Actions run researches,
rewrites, and publishes every article with no human in the loop. The repository
contains two parts:

- **`src/agent`** – the TypeScript code for an LLM agent that gathers research and
  writes updates.
- **`src/website`** – an Astro site that is automatically populated with those
  updates and served on GitHub Pages.
- **`packages/article-contract`** – the shared article frontmatter contract used
  by both, so the agent and site can't drift.

```mermaid
flowchart LR
    subgraph actions[GitHub Actions]
        trigger[Pipeline<br/>monthly · manual]
    end

    subgraph agent[src/agent]
        research[Research Agent<br/>Vercel AI SDK]
        search[Web Search<br/>provider-hosted, cited]
    end

    subgraph content[Markdown content]
        latest[Latest article]
        archive[Archived editions]
    end

    subgraph website[src/website]
        astro[Astro build]
        pages[GitHub Pages]
    end

    trigger --> research
    research <--> search
    latest -->|reads previous| research
    research -->|writes new edition| latest
    latest -->|outgoing version| archive
    latest -->|auto-merged PR<br/>audit trail| astro
    archive --> astro
    astro --> pages
    pages -.->|reader flags an issue| issue[GitHub Issue]
```

## Autonomous publishing

The `run_agent.yml` workflow runs on a monthly schedule (01:23 UTC on the 1st,
early afternoon on the 1st in Pacific/Auckland) and can also be started
manually from the Actions tab. Each run:

1. Researches and rewrites every configured article.
2. Opens a pull request with the changes and a token-usage report comment.
3. Merges the pull request automatically and triggers the website deploy.

No human approves an update before it goes live. Instead, every run leaves a
complete audit trail: the merged pull request records the exact content
changes, the usage comment records model and token spend, and the Actions run
logs record how the agent arrived at its output. If a published article has a
problem, use the "Flag an issue" link on the article page (or open an
[article feedback issue](https://github.com/mingnz/livingwp/issues/new?template=article-feedback.yml)
directly) and it can be corrected in a follow-up run or manual edit.

Manual runs merge automatically too by default; untick the `auto_merge` input
when dispatching the workflow to leave the pull request open for review
instead.

## Contributing

We welcome contributions from the community! There are two main ways you can get involved:

- **Open a Pull Request**: If you want to make direct edits to the code or documentation, please fork the repository and open a Pull Request with your changes. This includes updates to the agent logic, website, or any other part of the project.

- **Open an Issue**: If you have suggestions, ideas, or have found a bug, feel free to open an Issue. This is a great way to propose new features, report problems, or discuss improvements. To report a problem in a published article, use the "Flag an issue" link on the article page — it pre-fills the article feedback template.

### Editing the Research Prompts

The default industry prompt is defined in [`src/agent/prompts/instructions_research.md`](https://github.com/mingnz/livingwp/blob/main/src/agent/prompts/instructions_research.md).
The New Zealand snapshot uses [`src/agent/prompts/instructions_research_nz_snapshot.md`](https://github.com/mingnz/livingwp/blob/main/src/agent/prompts/instructions_research_nz_snapshot.md).

You can suggest changes to these prompts by either:

- Opening a Pull Request directly with your proposed edits to the prompt file.
- Opening an Issue to discuss or suggest changes to the prompt.

## Articles, prompts and models

The settings for each generated article are defined in [`src/agent/config/industries.json`](https://github.com/mingnz/livingwp/blob/main/src/agent/config/industries.json). Changing these settings allows you to:

- Add a new industry article. A new page will be created and added to the site the next time the update process runs.
- Configure special non-industry articles such as the `nz` monthly national snapshot.
- Pin one article to a specific model via `research_model`. Bare names (e.g. `gpt-5.4-2026-03-05`) use OpenAI; prefix with `anthropic/` or `google/` to use those providers. Leave the key out to use the default model for every article.
- Pin one article to a specific reasoning effort via `research_reasoning_effort`: `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`. Leave the key out to use the default effort for every article.
- Add a new instructions file to [`src/agent/prompts/`](https://github.com/mingnz/livingwp/blob/main/src/agent/prompts/) and use it to prompt the research agent for a specific article or industry.

The agent is built on the [Vercel AI SDK](https://ai-sdk.dev), so it works with any supported provider. The default research model is `gpt-5.4-2026-03-05` (OpenAI), overridden by the `RESEARCH_MODEL` environment variable (a repository variable of that name in GitHub Actions). Each provider's hosted web-search tool is used automatically based on the resolved provider.

Reasoning effort works the same way. The default is `medium`, overridden by the `RESEARCH_REASONING_EFFORT` environment variable. The scale is shared across providers and mapped onto each one's own option: OpenAI's `reasoningEffort`, Anthropic's `effort`, and Google's `thinkingLevel`. OpenAI accepts the whole scale. Anthropic has no level below `low`, and Google's tops out at `high`, so the ends clamp to the nearest supported level on those providers.

An article's `research_model` and `research_reasoning_effort` take precedence over the matching environment variable. Articles with no such key follow the environment variable, so a single variable change moves every article at once.

We look forward to your contributions!

## File search

In addition to web search results, the agent can be prompted to incorporate material from your collated articles, papers and transcripts:

**Update the article config** 

- Create the vector store in [platform.openai.com](https://platform.openai.com/storage/vector_stores/). 
- Add a `file_store_name` key for the article in [`src/agent/config/industries.json`](https://github.com/mingnz/livingwp/blob/main/src/agent/config/industries.json). File search uses OpenAI vector stores, so the article's `research_model` must be an OpenAI model.
- Where they're available, you can also provide public URLs for any files in the store by adding `filename_urls` to the configuration. This will allow the agent to include citation links for any referenced files.

E.g.

```json
   "file_store_name": "finance_files",
   "filename_urls": {        
        "2504.20086v1.pdf": {"title":"Understanding and Mitigating Risks of Generative AI", "url": "https://arxiv.org/pdf/2504.20086v1"},
        "BloombergGPT.pdf": {"title":"BloombergGPT", "url": "https://arxiv.org/pdf/2303.17564"},
        "Large Language Models in Finance.pdf": {"title":"Large Language Models in Finance", "url": "https://arxiv.org/pdf/2311.10723"}
    }
```

**Update the instructions:** 

- The configuration changes will give the agent access to the required tools but you'll also need to provide specific instructions on how to use them

E.g. 

```md
# Gather Information
- ...
- Use the file search tool to perform an extensive review of all of the available curated articles, papers and transcripts.
    
# Output Format
- ...
- For file search results, include a markdown link for every factual claim from a private file. Use the filename_to_link_converter tool to provide the link for each file. Do not include placeholders for file links if the tool doesn't return one. Enclose each file link in parentheses e.g. (markdown_link). Include links for files after any web search links for the same paragraph.
- Ensure all markdown hyperlinks in the final output are correctly formatted
    
```


## Process

```mermaid
flowchart TD
    A[Run Update Task<br/>on Schedule] --> B{Check for<br/>Existing Article}

    B -->|Article Found| C1[Run Deep Research Agent<br/>Topic + Previous Article]
    B -->|No Article| C2[Run Deep Research Agent<br/>Topic Only]

    C1 --> D[Update Article<br/>with Research Results]
    C2 --> D

    D --> E[Commit Changes]

    E --> F[Open PR<br/>Audit Trail]

    F --> G[Auto-Merge PR]

    G --> H[GitHub Action<br/>Auto Deploy to Website]

    H --> I[End]

    H -.->|Reader flags an issue| J[GitHub Issue<br/>Human Follow-up]
```

## Development

### Requirements

- [Node.js](https://nodejs.org) 22+

The repo is an npm-workspaces monorepo (`src/agent`, `src/website`,
`packages/article-contract`). Install everything once from the root:

```sh
npm install
```

### Running the Agent

1. Make sure the API key for your configured provider is available in your
   environment (`OPENAI_API_KEY` by default; `ANTHROPIC_API_KEY` or
   `GOOGLE_GENERATIVE_AI_API_KEY` if you use those providers). See
   [`.env.sample`](.env.sample).

2. Run the agent from the repo root:

   ```sh
   npm run agent
   ```

This iterates over each configured article in
`src/agent/config/industries.json`, rewriting the latest page with fresh
research and archiving the outgoing version under
`src/website/whitepaper/content/archive/<slug>/`.

That includes both sector articles such as `healthcare` and the national
snapshot article `nz`.

You can also target specific articles by passing a comma-separated filter. For
example:

```sh
npm run agent -- nz
npm run agent -- finance,healthcare
```

### Working on the Website

Serve the site locally from the repo root:

```sh
npm run dev:site
```

The site will be available at `http://localhost:4321` by default.
