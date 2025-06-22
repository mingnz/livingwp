import asyncio
from livingwp.agents import update_articles


def main() -> None:
    asyncio.run(update_articles())
