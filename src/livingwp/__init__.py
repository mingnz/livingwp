import argparse
import asyncio
import logging
from livingwp.utils.logging import logger
from livingwp.agents import update_articles


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    parser = argparse.ArgumentParser(description="Update Living Whitepaper articles.")
    parser.add_argument(
        "article_filter",
        nargs="?",
        default=None,
        help="Filter for articles to update (optional)",
    )
    args = parser.parse_args()

    logger.info("Starting Living Whitepaper update...")
    asyncio.run(update_articles(args.article_filter))
