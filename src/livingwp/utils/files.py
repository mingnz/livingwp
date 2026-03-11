import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from livingwp.utils.markdown import format_markdown, parse_markdown

SITE_CONTENT_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "website"
    / "whitepaper"
    / "content"
)
SITE_ARCHIVE_DIR = SITE_CONTENT_DIR / "archive"
INDUSTRIES_CONFIG_PATH = (
    Path(__file__).resolve().parent.parent / "config" / "industries.json"
)
SITE_TIMEZONE = ZoneInfo("Pacific/Auckland")


def load_industry_article(industry: str) -> str | None:
    """Loads [industry].markdown from the website content folder,

    Returns the file contents or None if the article doesn't exist
    """
    file_path = Path(SITE_CONTENT_DIR, f"{industry}.markdown")
    if file_path.is_file():
        return file_path.read_text()
    return None


def load_article_archive_entries(
    industry: str, limit: int | None = None
) -> list[dict[str, Any]]:
    """Load archived article bodies and metadata for an article series."""
    archive_dir = SITE_ARCHIVE_DIR / industry
    if not archive_dir.is_dir():
        return []

    entries: list[dict[str, Any]] = []
    for path in archive_dir.glob("*.markdown"):
        metadata, body = parse_markdown(path.read_text())
        entries.append(
            {
                "path": path,
                "metadata": metadata,
                "body": body,
                "article_updated_at": parse_article_timestamp(
                    metadata.get("article_updated_at")
                )
                or datetime.min.replace(tzinfo=SITE_TIMEZONE),
            }
        )

    entries.sort(key=lambda item: item["article_updated_at"], reverse=True)
    if limit is not None:
        return entries[:limit]
    return entries


def save_industry_article(
    industry: str, article: str, article_updated_at: datetime | None = None
):
    """Save the latest article for an industry to its stable sector URL."""
    timestamp = article_updated_at or current_article_timestamp()
    metadata, body = parse_markdown(article)
    normalized = normalize_article_metadata(
        industry,
        metadata,
        body,
        article_updated_at=timestamp,
        latest=True,
    )
    Path(SITE_CONTENT_DIR, f"{industry}.markdown").write_text(normalized)


def archive_industry_article(industry: str, article: str) -> Path:
    """Save a dated archive copy of the current latest article."""
    metadata, body = parse_markdown(article)
    timestamp = parse_article_timestamp(metadata.get("article_updated_at"))
    if timestamp is None:
        timestamp = current_article_timestamp()

    archive_slug = build_archive_slug(industry, timestamp)
    archive_path = SITE_ARCHIVE_DIR / industry / f"{archive_slug}.markdown"
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    normalized = normalize_article_metadata(
        industry,
        metadata,
        body,
        article_updated_at=timestamp,
        latest=False,
        archive_slug=archive_slug,
    )
    archive_path.write_text(normalized)
    return archive_path


def current_article_timestamp() -> datetime:
    return datetime.now(SITE_TIMEZONE).replace(microsecond=0)


def parse_article_timestamp(value: object) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=SITE_TIMEZONE)
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=SITE_TIMEZONE)

    text = str(value).strip()
    if not text:
        return None

    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        try:
            parsed_date = date.fromisoformat(text)
        except ValueError:
            return None
        return datetime(
            parsed_date.year,
            parsed_date.month,
            parsed_date.day,
            tzinfo=SITE_TIMEZONE,
        )

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=SITE_TIMEZONE)
    return parsed


def build_archive_slug(industry: str, timestamp: datetime) -> str:
    base_slug = timestamp.strftime("%Y-%m-%d-%H%M%S")
    candidate = base_slug
    suffix = 1
    while (SITE_ARCHIVE_DIR / industry / f"{candidate}.markdown").exists():
        suffix += 1
        candidate = f"{base_slug}-{suffix}"
    return candidate


def normalize_article_metadata(
    industry: str,
    metadata: dict[str, object],
    body: str,
    article_updated_at: datetime,
    *,
    latest: bool,
    archive_slug: str | None = None,
) -> str:
    normalized = dict(metadata)
    normalized["layout"] = "article"
    normalized["title"] = normalized.get(
        "title", f"AI in {industry.replace('_', ' ').title()}"
    )
    normalized["article"] = latest
    normalized["article_history"] = True
    normalized["article_latest"] = latest
    normalized["article_kind"] = normalized.get("article_kind", "industry")
    normalized["article_summary"] = extract_description(body, max_length=320)
    normalized["article_version"] = not latest
    normalized["article_series"] = industry
    normalized["article_updated_at"] = article_updated_at.isoformat()
    normalized["date"] = article_updated_at.isoformat()
    normalized["last_modified_at"] = article_updated_at.isoformat()
    normalized["description"] = extract_description(body)
    if latest:
        normalized["permalink"] = f"/whitepaper/{industry}/"
    else:
        if archive_slug is None:
            raise ValueError("archive_slug is required for archived articles")
        normalized["permalink"] = f"/whitepaper/{industry}/{archive_slug}/"
    return format_markdown(normalized, body)


def extract_description(body: str, max_length: int = 160) -> str:
    """Extract a plain-text description from the first paragraph of markdown."""
    # Strip headings, bold/italic markers, links, and images
    text = re.sub(r"^#+\s.*$", "", body, flags=re.MULTILINE)
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\*{1,2}(.+?)\*{1,2}", r"\1", text)
    text = re.sub(r"_+(.+?)_+", r"\1", text)

    # Find the first non-empty paragraph
    for paragraph in text.split("\n\n"):
        cleaned = " ".join(paragraph.split()).strip()
        if cleaned.lower().startswith(("updated:", "last updated:")):
            continue
        if len(cleaned) > 20:
            if len(cleaned) > max_length:
                return cleaned[: max_length - 1].rsplit(" ", 1)[0] + "\u2026"
            return cleaned

    return ""


def load_instruction(filename: str) -> str:
    prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
    return (prompts_dir / filename).read_text()


def load_industry_config() -> dict:
    """Load industry configuration from industries.json."""
    with open(INDUSTRIES_CONFIG_PATH, "r") as f:
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
