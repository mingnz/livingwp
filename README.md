# Living Whitepaper

An open source experiment tracking how generative AI is used across Aotearoa
New Zealand.  The repository contains two parts:

- **`src/livingwp`** – the Python code for an LLM agent that gathers research and
  writes updates.
- **`src/website`** – a Jekyll site that is automatically populated with those
  updates and served on GitHub Pages.

## Requirements

- [uv](https://github.com/astral-sh/uv) for Python dependencies
- Ruby and [Bundler](https://bundler.io) for running the website locally

## Running the Agent

1. Install Python dependencies:

   ```sh
   uv sync
   ```

2. Run the agent:

   ```sh
   uv run livingwp
   ```

## Working on the Website

1. Change to the site directory:

   ```sh
   cd src/website
   ```

2. Install Ruby gems:

   ```sh
   bundle install
   ```

3. Serve the site locally:

   ```sh
   bundle exec jekyll serve
   ```

The site will be available at `http://localhost:4000` by default.  Contributions
are welcome on [GitHub](https://github.com/mingnz/livingwp).
