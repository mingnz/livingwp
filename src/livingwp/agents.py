from agents import Agent, Runner, WebSearchTool
from pathlib import Path
from typing import Dict, Tuple

from livingwp.utils.files import load_instruction

MODEL_NAME = "gpt-4.1-mini"

writing_agent = Agent(
    name="WritingAgent",
    model=MODEL_NAME,
    handoff_description="Takes research notes and previous article to update or rewrite the article.",
    instructions=load_instruction("instructions_writing.md"),
)


research_agent = Agent(
    name="ResearchAgent",
    model=MODEL_NAME,
    handoff_description="Takes a research plan and gathers information.",
    instructions=load_instruction("instructions_research.md"),
    tools=[WebSearchTool(user_location={"type": "approximate", "country": "NZ"})],
    handoffs=[writing_agent],
)


planning_agent = Agent(
    name="PlanningAgent",
    model=MODEL_NAME,
    instructions=load_instruction("instructions_planning.md"),
    handoffs=[research_agent],
)


def _parse_markdown(text: str) -> Tuple[Dict[str, str], str, str]:
    """Parse a markdown file with YAML front matter.

    Returns a tuple of (front_matter_dict, front_matter_text, body).
    """
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1].strip()
            body = parts[2].lstrip("\n")
            front_matter: Dict[str, str] = {}
            for line in fm_text.splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    front_matter[key.strip()] = val.strip()
            return front_matter, fm_text, body
    return {}, "", text


async def update_articles() -> None:
    """Run the agent pipeline for each industry article."""
    content_dir = Path(__file__).resolve().parent.parent / "website" / "whitepaper" / "content"
    for path in sorted(content_dir.glob("*.markdown")):
        text = path.read_text()
        front_matter, fm_text, body = _parse_markdown(text)
        topic = front_matter.get("title", path.stem.replace("-", " "))
        initial_input = f"Topic: {topic}\nPrevious article:\n{body}"
        result = await Runner.run(planning_agent, input=initial_input)
        updated = f"---\n{fm_text}\n---\n\n{result.final_output.strip()}\n"
        path.write_text(updated)


async def run_agent() -> None:
    """Legacy entry point for running a single topic."""
    topic = "AI in Education"
    initial_input = f"Topic: {topic}"
    result = await Runner.run(planning_agent, input=initial_input)
    print("Final Output:")
    print(result.final_output)
