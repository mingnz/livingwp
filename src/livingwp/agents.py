from livingwp.utils.logging import logger
from agents import Agent, ModelSettings, Runner, WebSearchTool
from openai.types.shared.reasoning import Reasoning
from os import environ

from livingwp.utils.files import (
    archive_industry_article,
    load_instruction,
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


def get_article_stub(industry: str):
    logger.info(f"Creating article stub for new industry: {industry}")
    front_matter = {
        "layout": "article",
        "title": f"AI in {industry.replace('_', ' ').title()}",
        "permalink": f"/whitepaper/{industry}/",
        "article": True,
        "article_history": True,
        "article_latest": True,
        "article_series": industry,
    }
    body = f"This page is a placeholder for updates on AI adoption in the {industry} sector of Aotearoa New Zealand. It will be populated automatically by an LLM agent as new information becomes available."
    return format_markdown(front_matter, body)


async def update_articles(article_filter: str | None = None) -> dict[str, object]:
    """Run the agent pipeline for each industry article"""
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
        research_agent = get_research_agent(
            industry_name, industry_config.get(industry_name, {})
        )
        existing_article = load_industry_article(industry_name)
        text = existing_article or get_article_stub(industry_name)
        front_matter, body = parse_markdown(text)
        topic = front_matter.get("title", industry_name.replace("-", " "))
        initial_input = f"Topic: {topic}\nPrevious article:\n{body}"
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
