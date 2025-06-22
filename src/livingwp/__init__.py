import asyncio
from livingwp.agents import run_agent


def main() -> None:
    asyncio.run(run_agent())
