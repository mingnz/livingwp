import json
from pathlib import Path

SITE_CONTENT_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "website"
    / "whitepaper"
    / "content"
)
INDUSTRIES_CONFIG_PATH = (
    Path(__file__).resolve().parent.parent / "config" / "industries.json"
)


def load_industry_article(industry: str) -> str | None:
    """Loads [industry].markdown from the website content folder,

    Returns the file contents or None if the article doesn't exist
    """
    file_path = Path(SITE_CONTENT_DIR, f"{industry}.markdown")
    if file_path.is_file():
        return file_path.read_text()
    return None


def save_industry_article(industry: str, article: str):
    """Saves the article to [industry].markdown in the website content folder."""
    Path(SITE_CONTENT_DIR, f"{industry}.markdown").write_text(article)


def load_instruction(filename: str) -> str:
    prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
    return (prompts_dir / filename).read_text()


def load_industry_config() -> dict:
    """Load industry configuration from industries.json."""
    config_path = Path(__file__).resolve().parent.parent / "config" / "industries.json"
    with open(config_path, "r") as f:
        return json.load(f)


def add_industry(industry_name: str) -> str:
    """Add an industry to industries.json and return the key used.

    Converts industry_name to lowercase and replaces spaces with underscores.
    """
    # Process the industry name
    industry_key = industry_name.lower().replace(" ", "_")

    # Load existing config
    with open(INDUSTRIES_CONFIG_PATH, "r") as f:
        config = json.load(f)

    # Add new industry with default configuration
    config[industry_key] = {
        "instructions_filename": "instructions_research.md",
        "research_model": "gpt-5.4-2026-03-05",
    }

    # Save updated config
    with open(INDUSTRIES_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)

    return industry_key
