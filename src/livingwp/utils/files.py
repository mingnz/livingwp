import json
from pathlib import Path

SITE_CONTENT_DIR = (
        Path(__file__).resolve().parent.parent.parent / "website" / "whitepaper" / "content"
    )
    
def load_industry_article(industry: str) -> str|None:
    """Loads [industry].markdown from the website content folder, 

    Returns the file contents or None if the article doesn't exist
    """    
    file_path = Path(SITE_CONTENT_DIR,f"{industry}.markdown")
    if file_path.is_file():
       return file_path.read_text()
    else: return None
    
def save_industry_article(industry: str, article:str) :
    """Saves the article to [industry].markdown in the website content folder, 
    """ 
    Path(SITE_CONTENT_DIR,f"{industry}.markdown").write_text(article)
    
def load_instruction(filename: str) -> str:
    prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
    return (prompts_dir / filename).read_text()

def load_industry_config() -> dict:
    """Load industry configuration from industries.json."""
    config_path = Path(__file__).resolve().parent.parent / "config" / "industries.json"
    with open(config_path, "r") as f:
        return json.load(f)