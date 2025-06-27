from agents import Agent, Runner, WebSearchTool
from pathlib import Path
from typing import Dict, Tuple

from livingwp.utils.files import load_instruction

MODEL_NAME = "gpt-4.1-mini"


research_agent = Agent(
    name="ResearchAgent",
    model=MODEL_NAME,
    instructions=load_instruction("instructions_research.md"),
    tools=[WebSearchTool()],
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
    content_dir = (
        Path(__file__).resolve().parent.parent / "website" / "whitepaper" / "content"
    )
    for path in sorted(content_dir.glob("*.markdown")):
        text = path.read_text()
        front_matter, fm_text, body = _parse_markdown(text)
        topic = front_matter.get("title", path.stem.replace("-", " "))
        initial_input = f"Topic: {topic}\nPrevious article:\n{body}"
        research_result = await Runner.run(research_agent, input=initial_input)
        print(f"Research result for {topic}:\n{research_result.final_output}\n")
        updated = f"---\n{fm_text}\n---\n\n{research_result.final_output.strip()}\n"
        path.write_text(updated)


async def run_agent() -> None:
    """Legacy entry point for running a single topic."""
    topic = "AI in Education"
    initial_input = f"Topic: {topic}"
    result = await Runner.run(research_agent, input=initial_input)
    print("Final Output:")
    print(result.final_output)
