from agents import Agent, Runner, WebSearchTool


writing_agent = Agent(
    name="WritingAgent",
    model="gpt-4.1",
    handoff_description="Takes research notes and previous article to update or rewrite the article.",
    instructions=(
        "You are a writing agent. Given research notes and the previous article, "
        "update or rewrite the article to incorporate new research. Output markdown. "
        "Ensure the article is relevant to a New Zealand context. Keep all references."
    ),
)


research_agent = Agent(
    name="ResearchAgent",
    model="gpt-4.1",
    handoff_description="Takes a research plan and gathers information.",
    instructions=(
        "You are a research agent. Given a research plan, topic, and the previous article, "
        "use the web_search tool to gather new, relevant information, focusing on New Zealand sources, data, and context. "
        "Explore different facets of the topic as outlined in the plan, with an emphasis on New Zealand's situation, policies, and developments. "
        "Output your research as markdown notes. Prioritize latest information, 2025 ideally, and ensure findings are relevant to New Zealand. "
        "Then call WritingAgent."
    ),
    tools=[WebSearchTool(user_location={"type": "approximate", "country": "NZ"})],
    handoffs=[writing_agent],
)


planning_agent = Agent(
    name="PlanningAgent",
    model="gpt-4.1",
    instructions=(
        "You are a planning agent. Given the topic, previous article, and any user-provided information, "
        "create a detailed research plan focused on the New Zealand context. The plan should include key questions to answer, subtopics to explore, "
        "and suggested sources or methods, with an emphasis on New Zealand-specific issues, data, and perspectives. "
        "Then call ResearchAgent"
    ),
    handoffs=[research_agent],  # Will be set after research_agent is defined
)


async def run_agent() -> None:
    topic = "AI in Education"
    initial_input = f"Topic: {topic}"
    result = await Runner.run(planning_agent, input=initial_input)
    print("Final Output:")
    print(result.final_output)
