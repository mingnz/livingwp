from livingwp.utils.logging import logger
from agents import Agent, Runner, WebSearchTool, ToolCallItem
from os import environ

from livingwp.utils.files import (
    load_instruction,
    load_industry_config,
    load_industry_article,
    save_industry_article,
)
from livingwp.utils.markdown import parse_markdown, format_markdown
from livingwp.utils.file_search import get_file_search_tool

# For testing, you should use a lightweight model like gpt-4.1-mini.
DEFAULT_MODEL_NAME = environ.get("RESEARCH_MODEL", "o4-mini-deep-research")
DEFAULT_INSTRUCTIONS_FILENAME = environ.get(
    "RESEARCH_INSTRUCTIONS_FILENAME", "instructions_research.md"
)
STREAMING_ENABLED = environ.get("STREAMING_ENABLED", "True") == "True"


def get_research_agent(industry_name, config={}):
    """Create agent using config or defaults"""

    tools_to_use = [WebSearchTool()]
    #If a file store name is provided, add the file search tool
    file_store_name = config.get("file_store_name", None)
    if file_store_name:
        file_search_tool = get_file_search_tool(file_store_name)
        if file_search_tool:
            tools_to_use.append(file_search_tool)

    return Agent(
        name=f"ResearchAgent-{industry_name}",
        model=config.get("research_model", DEFAULT_MODEL_NAME),
        instructions=load_instruction(
            config.get("instructions_filename", DEFAULT_INSTRUCTIONS_FILENAME)
        ),
        tools=tools_to_use,
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
            elif (
                hasattr(ev, "item")
                and isinstance(ev.item, ToolCallItem)
                and ev.item.raw_item.type == "file_search_call"
            ):
                for q in ev.item.raw_item.queries:
                    logger.info(f"[File search] query={q}")
        # streaming is complete → final_output is now populated
        return result_stream
    else:
        logger.info(f"Researching: {topic} (Streaming Disabled)")
        return await Runner.run(research_agent, initial_input)


def get_article_stub(industry: str):
    logger.info(f"Creating article stub for new industry: {industry}")
    industry_name = industry.replace("_", " ").title()
    front_matter = {
        "layout": "page",
        "title": f"AI in {industry_name}",
        "permalink": f"/whitepaper/{industry}/",
        "article": True,
    }
    body = f"# AI in {industry_name} in Aotearoa New Zealand: A Living Whitepaper"
    return format_markdown(front_matter, body)


async def update_articles(article_filter: str | None = None) -> None:
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
    for industry_name in industries:
        research_agent = get_research_agent(
            industry_name, industry_config.get(industry_name, {})
        )
        text = load_industry_article(industry_name) or get_article_stub(industry_name)
        front_matter, body = parse_markdown(text)
        topic = front_matter.get("title", industry_name.replace("-", " "))
        initial_input = f"Topic: {topic}\nPrevious article:\n{body}"
        research_result = await perform_research(topic, research_agent, initial_input)
        logger.info(f"Research result for {topic}:\n{research_result.final_output}\n")
        updated = format_markdown(front_matter, research_result.final_output.strip())
        save_industry_article(industry_name, updated)
