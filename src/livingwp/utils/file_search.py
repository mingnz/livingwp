from agents import FileSearchTool
from openai import OpenAI
from typing import Optional
from livingwp.utils.logging import logger


def get_store_id(name: str) -> Optional[str]:
    """
    Returns the vector store ID for a given store name.

    Returns:
        The ID of the vector store if found, None otherwise

    """
    client = OpenAI()

    # List all vector stores
    vector_stores = client.vector_stores.list()

    # Find the store with matching name
    for store in vector_stores.data:
        if store.name == name:
            logger.info(f"Found store id {store.id} for {name} store")
            return store.id

    logger.warning(f"Could not find a store with the name {name}")
    return None


def get_file_search_tool(file_store_name: str):
    """
    Returns a file search tool for the named file store

    Returns:
        A file search tool if the store is found, None otherwise

    """
    store_id = get_store_id(file_store_name)
    if store_id:
        return FileSearchTool(vector_store_ids=[store_id], include_search_results=True)
    return None
