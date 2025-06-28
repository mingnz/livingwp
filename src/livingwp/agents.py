from agents import Agent, Runner, WebSearchTool
from pathlib import Path
from os import environ

from livingwp.utils.files import load_instruction
from livingwp.utils.markdown import parse_markdown

# For testing, you should use a lightweight model like gpt-4.1-mini.
MODEL_NAME = environ.get("RESEARCH_MODEL", "o4-mini-deep-research")


research_agent = Agent(
    name="ResearchAgent",
    model=MODEL_NAME,
    instructions=load_instruction("instructions_research.md"),
    tools=[WebSearchTool()],
)


async def update_articles(article_filter=None) -> None:
    """Run the agent pipeline for each industry article using streaming."""
    content_dir = (
        Path(__file__).resolve().parent.parent / "website" / "whitepaper" / "content"
    )
    pattern = f"*{article_filter}*.markdown" if article_filter else "*.markdown"
    print(f"Update with filter: {article_filter or 'all articles'}")
    for path in sorted(content_dir.glob(pattern)):
        text = path.read_text()
        front_matter, fm_text, body = parse_markdown(text)
        topic = front_matter.get("title", path.stem.replace("-", " "))
        initial_input = f"Topic: {topic}\nPrevious article:\n{body}"
        print(f"Researching: {topic}")
        result_stream = Runner.run_streamed(research_agent, initial_input)
        async for ev in result_stream.stream_events():
            if ev.type == "agent_updated_stream_event":
                print(f"\n--- switched to agent: {ev.new_agent.name} ---")
                print("\n--- RESEARCHING ---")
            elif (
                ev.type == "raw_response_event"
                and hasattr(ev.data, "item")
                and hasattr(ev.data.item, "action")
            ):
                action = ev.data.item.action
                # Use attribute access instead of .get()
                if getattr(action, "type", None) == "search":
                    print(f"[Web search] query={getattr(action, 'query', None)!r}")
        # streaming is complete → final_output is now populated
        research_result = result_stream
        print(f"Research result for {topic}:\n{research_result.final_output}\n")
        updated = f"---\n{fm_text}\n---\n\n{research_result.final_output.strip()}\n"
        path.write_text(updated)
