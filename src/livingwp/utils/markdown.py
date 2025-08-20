import frontmatter


def parse_markdown(text: str) -> tuple[dict[str, object], str]:
    """Parse a markdown file with YAML front matter.

    Returns a tuple of (front_matter_dict, body).
    """
    return frontmatter.parse(text)


def format_markdown(metadata: dict[str, object], body: str) -> str:
    """Combines metadata and body into markdown document with YAML frontmatter.

    Returns the thge text of the markdown document with frontmatter
    """
    post = frontmatter.Post(body, **metadata)
    return frontmatter.dumps(post)
