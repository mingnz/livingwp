import json
from pathlib import Path


def load_instruction(filename: str) -> str:
    prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
    return (prompts_dir / filename).read_text()

def load_industry_config() -> dict:
    """Load industry configuration from industries.json."""
    config_path = Path(__file__).resolve().parent.parent / "config" / "industries.json"
    with open(config_path, "r") as f:
        return json.load(f)