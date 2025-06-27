import asyncio
from livingwp.agents import update_articles


def main() -> None:
    print("Starting Living Whitepaper update...")
    asyncio.run(update_articles())
