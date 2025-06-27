from typing import Dict, Tuple


def parse_markdown(text: str) -> Tuple[Dict[str, str], str, str]:
    """Parse a markdown file with YAML front matter.

    Returns a tuple of (front_matter_dict, front_matter_text, body).
    """
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1].strip()
            body = parts[2].lstrip("\n")
            front_matter: Dict[str, str] = {}
            for line in fm_text.splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    front_matter[key.strip()] = val.strip()
            return front_matter, fm_text, body
    return {}, "", text
