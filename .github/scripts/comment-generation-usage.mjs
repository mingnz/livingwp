import { existsSync, readFileSync } from "node:fs";

const MARKER = "<!-- livingwp-usage-report -->";

async function main() {
  const token = requireEnv("GITHUB_TOKEN");
  const repository = requireEnv("GITHUB_REPOSITORY");
  const usageReportPath = requireEnv("USAGE_REPORT_PATH");
  const apiBaseUrl = process.env.GITHUB_API_URL || "https://api.github.com";
  const changesDetected = process.env.CHANGES_DETECTED === "true";
  const createdPrNumber = normalize(process.env.CREATED_PR_NUMBER);
  const branchName = normalize(process.env.BRANCH_NAME);

  if (!existsSync(usageReportPath)) {
    throw new Error(`Usage report not found at ${usageReportPath}`);
  }

  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`);
  }

  const report = JSON.parse(readFileSync(usageReportPath, "utf8"));
  const prNumber = createdPrNumber || (await resolvePullRequestNumber({
    owner,
    repo,
    branchName,
    apiBaseUrl,
    token,
  }));

  if (!prNumber) {
    console.log("No pull request found for this run; skipping usage comment.");
    return;
  }

  const body = buildCommentBody(report, changesDetected);
  const comments = await githubPaginate(
    `/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`,
    { apiBaseUrl, token }
  );
  const existingComment = comments.find(
    (comment) => typeof comment.body === "string" && comment.body.includes(MARKER)
  );

  if (existingComment) {
    await githubRequest(`/repos/${owner}/${repo}/issues/comments/${existingComment.id}`, {
      apiBaseUrl,
      token,
      method: "PATCH",
      body: { body },
    });
    console.log(`Updated usage comment on PR #${prNumber}.`);
    return;
  }

  await githubRequest(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    apiBaseUrl,
    token,
    method: "POST",
    body: { body },
  });
  console.log(`Created usage comment on PR #${prNumber}.`);
}

async function resolvePullRequestNumber({
  owner,
  repo,
  branchName,
  apiBaseUrl,
  token,
}) {
  if (!branchName) {
    return null;
  }

  const pullRequests = await githubPaginate(
    `/repos/${owner}/${repo}/pulls?state=open&head=${encodeURIComponent(
      `${owner}:${branchName}`
    )}&per_page=100`,
    { apiBaseUrl, token }
  );

  if (pullRequests.length === 0) {
    console.log(`No open pull request found for branch ${branchName}.`);
    return null;
  }

  return String(pullRequests[0].number);
}

function buildCommentBody(report, changesDetected) {
  const totals = report.totals || {};
  const costLabel = totals.cost_complete
    ? formatUsd(totals.estimated_cost_usd)
    : `${formatUsd(totals.estimated_cost_usd)} (partial)`;

  const articleRows = (report.articles || []).map((article) => {
    const articleCost = article.cost_complete
      ? formatUsd(article.estimated_cost_usd)
      : "n/a";
    return [
      article.industry,
      `\`${article.model}\``,
      formatInteger(article.total_tokens),
      formatInteger(article.input_tokens),
      formatInteger(article.output_tokens),
      formatInteger(article.web_search_calls),
      articleCost,
    ];
  });

  const table = articleRows.length
    ? [
        "| Industry | Model | Total tokens | Input | Output | Web searches | Estimated cost |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
        ...articleRows.map((row) => `| ${row.join(" | ")} |`),
      ].join("\n")
    : "_No articles were processed._";

  const unpricedModels =
    Array.isArray(report.unpriced_models) && report.unpriced_models.length > 0
      ? `\n\nCost could not be calculated for: ${report.unpriced_models
          .map((model) => `\`${model}\``)
          .join(", ")}.`
      : "";

  return [
    MARKER,
    "## Generation Usage",
    "",
    `- Generated at: ${report.generated_at}`,
    `- Content changes detected: ${changesDetected ? "yes" : "no"}`,
    `- Articles processed: ${formatInteger(totals.articles)}`,
    `- Requests: ${formatInteger(totals.requests)}`,
    `- Total tokens: ${formatInteger(totals.total_tokens)}`,
    `- Cached input tokens: ${formatInteger(totals.cached_input_tokens)}`,
    `- Reasoning tokens: ${formatInteger(totals.reasoning_tokens)}`,
    `- Web search calls: ${formatInteger(totals.web_search_calls)}`,
    `- Estimated cost: ${costLabel}`,
    "",
    table,
    "",
    "Estimated cost is derived from token usage plus OpenAI web-search call pricing.",
  ].join("\n") + unpricedModels;
}

async function githubPaginate(path, { apiBaseUrl, token }) {
  const items = [];
  let url = `${apiBaseUrl}${path}`;

  while (url) {
    const response = await githubRequest(url, {
      apiBaseUrl,
      token,
      absoluteUrl: true,
    });
    const payload = await response.json();
    items.push(...payload);
    url = parseNextLink(response.headers.get("link"));
  }

  return items;
}

async function githubRequest(
  path,
  { apiBaseUrl, token, method = "GET", body = null, absoluteUrl = false }
) {
  const url = absoluteUrl ? path : `${apiBaseUrl}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${method} ${url} failed: ${response.status} ${errorText}`);
  }

  return response;
}

function parseNextLink(linkHeader) {
  if (!linkHeader) {
    return null;
  }

  for (const entry of linkHeader.split(",")) {
    const [urlPart, relPart] = entry.split(";");
    if (relPart && relPart.includes('rel="next"')) {
      return urlPart.trim().slice(1, -1);
    }
  }

  return null;
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatUsd(value) {
  if (value === null || value === undefined) {
    return "n/a";
  }
  return `$${Number(value).toFixed(4)}`;
}

function normalize(value) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function requireEnv(name) {
  const value = normalize(process.env[name]);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

await main();
