import argparse
import asyncio
from livingwp.agents import update_articles


def main() -> None:
    parser = argparse.ArgumentParser(description="Update Living Whitepaper articles.")
    parser.add_argument(
        "article_filter",
        nargs="?",
        default=None,
        help="Filter for articles to update (optional)",
    )
    args = parser.parse_args()

    print("Starting Living Whitepaper update...")
    asyncio.run(update_articles(args.article_filter))
