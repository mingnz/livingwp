import asyncio
from agents import Agent, Runner


spanish_agent = Agent(
    name="Spanish agent",
    instructions="You only speak Spanish.",
)

english_agent = Agent(
    name="English agent",
    instructions="You only speak English",
)

triage_agent = Agent(
    name="Triage agent",
    instructions="Handoff to the appropriate agent based on the language of the request.",
    handoffs=[spanish_agent, english_agent],
)


async def run_agent() -> None:
    result = await Runner.run(triage_agent, input="Hola, ¿cómo estás?")
    print(result.final_output)


def main() -> None:
    asyncio.run(run_agent())
