from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from os import environ
from pathlib import Path
from typing import Any

from agents.usage import Usage

from livingwp.utils.logging import logger

USAGE_REPORT_PATH_ENV = "LIVINGWP_USAGE_REPORT_PATH"
USAGE_COMMENT_PATH_ENV = "LIVINGWP_USAGE_COMMENT_PATH"
MODEL_PRICING_OVERRIDES_ENV = "LIVINGWP_MODEL_PRICING_OVERRIDES_JSON"
WEB_SEARCH_COST_ENV = "LIVINGWP_WEB_SEARCH_COST_PER_1000_USD"
USAGE_COMMENT_MARKER = "<!-- livingwp-usage-report -->"

# Default rates are sourced from OpenAI's public pricing page and can be overridden
# in CI via LIVINGWP_MODEL_PRICING_OVERRIDES_JSON if pricing changes.
DEFAULT_MODEL_PRICING: dict[str, dict[str, Decimal]] = {
    "gpt-5.4": {
        "input_per_million_usd": Decimal("2.50"),
        "cached_input_per_million_usd": Decimal("0.25"),
        "output_per_million_usd": Decimal("15.00"),
    }
}
DEFAULT_WEB_SEARCH_COST_PER_1000_USD = Decimal("10.00")


def build_article_usage_report(
    *,
    industry: str,
    topic: str,
    model_name: str,
    result: Any,
) -> dict[str, Any]:
    usage = aggregate_usage(result.raw_responses)
    web_search_calls = count_web_search_calls(result.raw_responses)
    estimated_cost, pricing_model = estimate_usage_cost(
        model_name=model_name,
        usage=usage,
        web_search_calls=web_search_calls,
    )

    cached_input_tokens = get_cached_input_tokens(usage)
    reasoning_tokens = get_reasoning_tokens(usage)

    return {
        "industry": industry,
        "topic": topic,
        "model": model_name,
        "pricing_model": pricing_model,
        "requests": usage.requests or len(result.raw_responses),
        "input_tokens": usage.input_tokens,
        "cached_input_tokens": cached_input_tokens,
        "output_tokens": usage.output_tokens,
        "reasoning_tokens": reasoning_tokens,
        "total_tokens": usage.total_tokens,
        "web_search_calls": web_search_calls,
        "estimated_cost_usd": format_decimal(estimated_cost)
        if estimated_cost is not None
        else None,
        "cost_complete": estimated_cost is not None,
    }


def build_usage_report(
    *, article_filter: str | None, article_reports: list[dict[str, Any]]
) -> dict[str, Any]:
    total_cost = Decimal("0")
    cost_complete = True
    has_priced_cost = False
    unpriced_models: set[str] = set()

    totals = {
        "articles": len(article_reports),
        "requests": 0,
        "input_tokens": 0,
        "cached_input_tokens": 0,
        "output_tokens": 0,
        "reasoning_tokens": 0,
        "total_tokens": 0,
        "web_search_calls": 0,
    }

    for report in article_reports:
        totals["requests"] += int(report["requests"])
        totals["input_tokens"] += int(report["input_tokens"])
        totals["cached_input_tokens"] += int(report["cached_input_tokens"])
        totals["output_tokens"] += int(report["output_tokens"])
        totals["reasoning_tokens"] += int(report["reasoning_tokens"])
        totals["total_tokens"] += int(report["total_tokens"])
        totals["web_search_calls"] += int(report["web_search_calls"])

        estimated_cost = report.get("estimated_cost_usd")
        if estimated_cost is None:
            cost_complete = False
            unpriced_models.add(str(report["model"]))
            continue
        has_priced_cost = True
        total_cost += Decimal(str(estimated_cost))

    totals["estimated_cost_usd"] = (
        format_decimal(total_cost) if has_priced_cost or cost_complete else None
    )
    totals["cost_complete"] = cost_complete

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "article_filter": article_filter or None,
        "articles": article_reports,
        "totals": totals,
        "unpriced_models": sorted(unpriced_models),
    }


def write_usage_report_if_configured(report: dict[str, Any]) -> None:
    output_path = environ.get(USAGE_REPORT_PATH_ENV)
    if not output_path:
        return

    report_path = Path(output_path)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    logger.info(f"Wrote usage report to {report_path}")


def write_usage_comment_if_configured(report: dict[str, Any]) -> None:
    output_path = environ.get(USAGE_COMMENT_PATH_ENV)
    if not output_path:
        return

    comment_path = Path(output_path)
    comment_path.parent.mkdir(parents=True, exist_ok=True)
    comment_path.write_text(format_usage_comment(report))
    logger.info(f"Wrote usage comment to {comment_path}")


def format_usage_summary(report: dict[str, Any]) -> str:
    totals = report["totals"]
    estimated_cost = totals["estimated_cost_usd"]
    cost_label = estimated_cost if estimated_cost is not None else "n/a"
    if not totals["cost_complete"]:
        cost_label = f"{cost_label} (partial estimate)"

    return (
        "Usage summary: "
        f"{totals['articles']} article(s), "
        f"{totals['requests']} request(s), "
        f"{totals['total_tokens']} total token(s), "
        f"{totals['web_search_calls']} web search call(s), "
        f"estimated cost ${cost_label}"
    )


def format_usage_comment(report: dict[str, Any]) -> str:
    totals = report["totals"]
    cost_label = format_usage_cost_label(
        totals["estimated_cost_usd"], totals["cost_complete"]
    )

    article_rows = []
    for article in report["articles"]:
        article_rows.append(
            "| "
            + " | ".join(
                [
                    str(article["industry"]),
                    f"`{article['model']}`",
                    format_usage_integer(article["total_tokens"]),
                    format_usage_integer(article["input_tokens"]),
                    format_usage_integer(article["output_tokens"]),
                    format_usage_integer(article["web_search_calls"]),
                    format_usage_cost_label(
                        article["estimated_cost_usd"], article["cost_complete"]
                    ),
                ]
            )
            + " |"
        )

    table = "\n".join(
        [
            "| Industry | Model | Total tokens | Input | Output | Web searches | Estimated cost |",
            "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
            *article_rows,
        ]
    )
    if not article_rows:
        table = "_No articles were processed._"

    lines = [
        USAGE_COMMENT_MARKER,
        "## Generation Usage",
        "",
        f"- Generated at: {report['generated_at']}",
        f"- Articles processed: {format_usage_integer(totals['articles'])}",
        f"- Requests: {format_usage_integer(totals['requests'])}",
        f"- Total tokens: {format_usage_integer(totals['total_tokens'])}",
        f"- Cached input tokens: {format_usage_integer(totals['cached_input_tokens'])}",
        f"- Reasoning tokens: {format_usage_integer(totals['reasoning_tokens'])}",
        f"- Web search calls: {format_usage_integer(totals['web_search_calls'])}",
        f"- Estimated cost: {cost_label}",
    ]

    if report["article_filter"]:
        lines.append(f"- Filter: `{report['article_filter']}`")

    lines.extend(
        [
            "",
            table,
            "",
            "Estimated cost is derived from token usage plus OpenAI web-search call pricing.",
        ]
    )

    if report["unpriced_models"]:
        unpriced_models = ", ".join(
            f"`{model}`" for model in report["unpriced_models"]
        )
        lines.append("")
        lines.append(f"Cost could not be calculated for: {unpriced_models}.")

    return "\n".join(lines) + "\n"


def aggregate_usage(raw_responses: list[Any]) -> Usage:
    aggregated = Usage()
    for response in raw_responses:
        if getattr(response, "usage", None) is not None:
            aggregated.add(response.usage)

    if aggregated.requests == 0 and raw_responses:
        aggregated.requests = len(raw_responses)
    return aggregated


def count_web_search_calls(raw_responses: list[Any]) -> int:
    unique_call_ids: set[str] = set()
    anonymous_calls = 0

    for response in raw_responses:
        for output in getattr(response, "output", []):
            if get_item_value(output, "type") != "web_search_call":
                continue

            call_id = get_item_value(output, "id")
            if call_id:
                unique_call_ids.add(str(call_id))
            else:
                anonymous_calls += 1

    return len(unique_call_ids) + anonymous_calls


def estimate_usage_cost(
    *, model_name: str, usage: Usage, web_search_calls: int
) -> tuple[Decimal | None, str | None]:
    pricing_model = resolve_pricing_model(model_name)
    if pricing_model is None:
        return None, None

    pricing = load_model_pricing()[pricing_model]
    cached_input_tokens = Decimal(get_cached_input_tokens(usage))
    uncached_input_tokens = Decimal(max(usage.input_tokens - int(cached_input_tokens), 0))
    output_tokens = Decimal(usage.output_tokens)
    web_search_cost = (
        Decimal(web_search_calls) * get_web_search_cost_per_1000() / Decimal("1000")
    )

    estimated_cost = (
        uncached_input_tokens * pricing["input_per_million_usd"] / Decimal("1000000")
        + cached_input_tokens
        * pricing["cached_input_per_million_usd"]
        / Decimal("1000000")
        + output_tokens * pricing["output_per_million_usd"] / Decimal("1000000")
        + web_search_cost
    )
    return estimated_cost, pricing_model


def resolve_pricing_model(model_name: str) -> str | None:
    pricing = load_model_pricing()
    if model_name in pricing:
        return model_name

    normalized = re.sub(r"-(?:\d{4}-\d{2}-\d{2}|latest)$", "", model_name)
    if normalized in pricing:
        return normalized
    return None


def load_model_pricing() -> dict[str, dict[str, Decimal]]:
    pricing = {
        model_name: {key: Decimal(str(value)) for key, value in values.items()}
        for model_name, values in DEFAULT_MODEL_PRICING.items()
    }

    overrides = environ.get(MODEL_PRICING_OVERRIDES_ENV)
    if not overrides:
        return pricing

    try:
        payload = json.loads(overrides)
    except json.JSONDecodeError as exc:
        logger.warning(
            f"Ignoring invalid {MODEL_PRICING_OVERRIDES_ENV}: {exc}"
        )
        return pricing

    if not isinstance(payload, dict):
        logger.warning(
            f"Ignoring invalid {MODEL_PRICING_OVERRIDES_ENV}: expected a JSON object"
        )
        return pricing

    for model_name, values in payload.items():
        try:
            pricing[model_name] = {
                "input_per_million_usd": Decimal(str(values["input_per_million_usd"])),
                "cached_input_per_million_usd": Decimal(
                    str(values["cached_input_per_million_usd"])
                ),
                "output_per_million_usd": Decimal(
                    str(values["output_per_million_usd"])
                ),
            }
        except (InvalidOperation, KeyError, TypeError, ValueError) as exc:
            logger.warning(
                f"Ignoring invalid pricing override for model {model_name}: {exc}"
            )

    return pricing


def get_web_search_cost_per_1000() -> Decimal:
    configured = environ.get(WEB_SEARCH_COST_ENV)
    if not configured:
        return DEFAULT_WEB_SEARCH_COST_PER_1000_USD

    try:
        return Decimal(configured)
    except InvalidOperation:
        logger.warning(
            f"Ignoring invalid {WEB_SEARCH_COST_ENV} value {configured!r}; using default"
        )
        return DEFAULT_WEB_SEARCH_COST_PER_1000_USD


def get_cached_input_tokens(usage: Usage) -> int:
    details = getattr(usage, "input_tokens_details", None)
    return int(getattr(details, "cached_tokens", 0) or 0)


def get_reasoning_tokens(usage: Usage) -> int:
    details = getattr(usage, "output_tokens_details", None)
    return int(getattr(details, "reasoning_tokens", 0) or 0)


def get_item_value(item: Any, key: str) -> Any:
    if isinstance(item, dict):
        return item.get(key)
    return getattr(item, key, None)


def format_usage_integer(value: object) -> str:
    return f"{int(value):,}"


def format_usage_cost_label(
    estimated_cost_usd: object | None, cost_complete: object
) -> str:
    if estimated_cost_usd is None:
        return "n/a (partial)"

    cost_label = f"${float(estimated_cost_usd):.4f}"
    if not bool(cost_complete):
        return f"{cost_label} (partial)"
    return cost_label


def format_decimal(value: Decimal) -> str:
    quantized = value.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    return format(quantized, "f")
