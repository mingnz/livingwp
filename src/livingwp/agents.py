from agents import Agent, Runner, WebSearchTool

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


async def run_agent() -> None:
    topic = "AI in Education"
    initial_input = f"Topic: {topic}"
    result = await Runner.run(planning_agent, input=initial_input)
    print("Final Output:")
    print(result.final_output)
