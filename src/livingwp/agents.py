from livingwp.utils.logging import logger
from agents import Agent, ModelSettings, Runner, WebSearchTool
from openai.types.shared.reasoning import Reasoning
from os import environ

from livingwp.utils.files import (
    archive_industry_article,
    current_article_timestamp,
    load_instruction,
    load_article_archive_entries,
    load_industry_config,
    load_industry_article,
    save_industry_article,
)
from livingwp.utils.markdown import parse_markdown, format_markdown
from livingwp.utils.usage import (
    build_article_usage_report,
    build_usage_report,
    write_usage_comment_if_configured,
    write_usage_report_if_configured,
)

DEFAULT_MODEL_NAME = environ.get("RESEARCH_MODEL", "gpt-5.4-2026-03-05")
# Keep GPT-5 behavior explicit so output shape stays stable across SDK upgrades.
DEFAULT_MODEL_SETTINGS = ModelSettings(
    reasoning=Reasoning(effort="medium"),
    verbosity="medium",
)
DEFAULT_INSTRUCTIONS_FILENAME = environ.get(
    "RESEARCH_INSTRUCTIONS_FILENAME", "instructions_research.md"
)
STREAMING_ENABLED = environ.get("STREAMING_ENABLED", "True") == "True"


def get_research_agent(industry_name, config=None):
    """Create agent using config or defaults"""
    config = config or {}
    return Agent(
        name=f"ResearchAgent-{industry_name}",
        model=config.get("research_model", DEFAULT_MODEL_NAME),
        model_settings=DEFAULT_MODEL_SETTINGS,
        instructions=load_instruction(
            config.get("instructions_filename", DEFAULT_INSTRUCTIONS_FILENAME)
        ),
        tools=[WebSearchTool()],
    )


def excerpt_history_body(body: str, max_chars: int = 2500) -> str:
    paragraphs: list[str] = []
    total_chars = 0

    for paragraph in body.split("\n\n"):
        cleaned = paragraph.strip()
        if not cleaned:
            continue

        separator = 2 if paragraphs else 0
        projected_total = total_chars + separator + len(cleaned)
        if projected_total <= max_chars:
            paragraphs.append(cleaned)
            total_chars = projected_total
            continue

        remaining = max_chars - total_chars - separator
        if remaining > 80:
            paragraphs.append(cleaned[:remaining].rsplit(" ", 1)[0] + "…")
        break

    return "\n\n".join(paragraphs).strip()


def format_history_context(industry: str, history_entries: list[dict[str, object]]) -> str:
    sections: list[str] = []
    default_title = industry.replace("_", " ").title()

    for entry in history_entries:
        metadata = dict(entry["metadata"])
        title = str(metadata.get("title", default_title))
        updated_at = str(metadata.get("article_updated_at", "unknown"))
        body = excerpt_history_body(str(entry["body"]))
        sections.append(f"### {title}\nUpdated: {updated_at}\n\n{body}")

    return "\n\n".join(sections)


def get_history_context_count(config: dict[str, object]) -> int:
    try:
        return max(0, int(config.get("history_context_count", 0) or 0))
    except (TypeError, ValueError):
        return 0


def build_research_input(
    industry_name: str,
    front_matter: dict[str, object],
    body: str,
    config: dict[str, object] | None = None,
) -> str:
    config = config or {}
    lines = [
        f"Current date: {current_article_timestamp().date().isoformat()}",
        f"Topic: {front_matter.get('title', industry_name.replace('-', ' '))}",
        f"Article slug: {industry_name}",
    ]

    previous_updated_at = front_matter.get("article_updated_at")
    if previous_updated_at:
        lines.append(f"Previous latest article updated at: {previous_updated_at}")

    lines.extend(
        [
            "",
            "Previous latest article:",
            body.strip() or "(No previous article content.)",
        ]
    )

    history_context_count = get_history_context_count(config)
    if history_context_count > 0:
        history_entries = load_article_archive_entries(
            industry_name, limit=history_context_count
        )
        if history_entries:
            lines.extend(
                [
                    "",
                    f"Archived article context (most recent {len(history_entries)}):",
                    format_history_context(industry_name, history_entries),
                ]
            )

    return "\n".join(lines)


async def perform_research(topic, research_agent, initial_input):
    if STREAMING_ENABLED:
        logger.info(f"Researching: {topic}")
        result_stream = Runner.run_streamed(research_agent, initial_input)
        async for ev in result_stream.stream_events():
            if ev.type == "agent_updated_stream_event":
                logger.info(f"\n--- switched to agent: {ev.new_agent.name} ---")
                logger.info("\n--- RESEARCHING ---")
            elif (
                ev.type == "raw_response_event"
                and hasattr(ev.data, "item")
                and hasattr(ev.data.item, "action")
            ):
                action = ev.data.item.action
                # Use attribute access instead of .get()
                if getattr(action, "type", None) == "search":
                    logger.info(
                        f"[Web search] query={getattr(action, 'query', None)!r}"
                    )
        # streaming is complete → final_output is now populated
        return result_stream
    else:
        logger.info(f"Researching: {topic} (Streaming Disabled)")
        return await Runner.run(research_agent, initial_input)


def get_article_stub(industry: str, config: dict[str, object] | None = None):
    logger.info(f"Creating article stub for new article: {industry}")
    config = config or {}
    title = str(config.get("title", f"AI in {industry.replace('_', ' ').title()}"))
    article_kind = str(config.get("article_kind", "industry"))
    front_matter = {
        "layout": "article",
        "title": title,
        "permalink": f"/whitepaper/{industry}/",
        "article": True,
        "article_history": True,
        "article_latest": True,
        "article_kind": article_kind,
        "article_series": industry,
    }
    body = str(
        config.get(
            "stub_body",
            (
                f"This page is a placeholder for updates on AI adoption in the {industry} "
                "sector of Aotearoa New Zealand. It will be populated automatically by "
                "an LLM agent as new information becomes available."
            ),
        )
    )
    return format_markdown(front_matter, body)


async def update_articles(article_filter: str | None = None) -> dict[str, object]:
    """Run the agent pipeline for each configured article."""
    logger.info(f"Update with filter: {article_filter or 'all articles'}")
    industry_config = load_industry_config()
    industries = industry_config.keys()
    if article_filter:
        industries_in_filter = article_filter.split(",")
        # Make sure the industries exist in industry_config
        industries = [
            industry for industry in industries if industry in industries_in_filter
        ]
    article_reports: list[dict[str, object]] = []
    for industry_name in industries:
        article_config = industry_config.get(industry_name, {})
        research_agent = get_research_agent(
            industry_name, article_config
        )
        existing_article = load_industry_article(industry_name)
        text = existing_article or get_article_stub(industry_name, article_config)
        front_matter, body = parse_markdown(text)
        topic = front_matter.get("title", industry_name.replace("-", " "))
        initial_input = build_research_input(
            industry_name,
            front_matter,
            body,
            article_config,
        )
        research_result = await perform_research(topic, research_agent, initial_input)
        article_reports.append(
            build_article_usage_report(
                industry=industry_name,
                topic=topic,
                model_name=str(research_agent.model),
                result=research_result,
            )
        )
        logger.info(f"Research result for {topic}:\n{research_result.final_output}\n")
        updated = format_markdown(front_matter, research_result.final_output.strip())
        if existing_article:
            archive_path = archive_industry_article(industry_name, existing_article)
            logger.info(
                f"Archived previous version for {industry_name} to {archive_path}"
            )
        save_industry_article(industry_name, updated)
    usage_report = build_usage_report(
        article_filter=article_filter, article_reports=article_reports
    )
    write_usage_report_if_configured(usage_report)
    write_usage_comment_if_configured(usage_report)
    return usage_report
