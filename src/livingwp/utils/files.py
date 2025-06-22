from pathlib import Path


def load_instruction(filename: str) -> str:
    prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
    return (prompts_dir / filename).read_text()
