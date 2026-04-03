from functools import partial
from agents import FileSearchTool
from agents import FunctionTool
from agents.tool_context import ToolContext
from openai import OpenAI
from typing import Optional
from livingwp.utils.logging import logger
import json


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
    for store in vector_stores:
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


async def convert_file_name_to_link(
    filename_urls: dict[str, str], context: ToolContext, filename: str
) -> str:
    """Called by the filename_to_link_converter tool to convert a filename into a markdown link based on the filename_lookup
    The agent will usually pass in a JSON object with a filename attribute (but sometimes it's just the filename as a string)
    """
    logger.info(f"Link requested for filename: {filename}")
    try:
        filename = json.loads(filename).get("filename", filename)
    except json.JSONDecodeError as exc:
        logger.warning(
            f"JSON decoding failed. Assuming filename passed as string: {exc}"
        )

    file_details = filename_urls.get(filename)

    if not file_details:
        logger.warning(f"No link found for {filename}")
        # Returning null as a string, rather than an empty string or None, resulted in more consistent behaviour
        return "null"

    result = f"[{file_details.get('title')}]({file_details.get('url')})"

    logger.info(f"Returning link: {result}")

    return result


def get_file_link_tool(filename_urls: dict[str, str]):
    """
    Returns a function tool to convert filenames into links from the details in filename_urls

    Returns:
        A function tool to convert filenames into links
    """

    return FunctionTool(
        name="filename_to_link_converter",
        description="Provides a markdown link for a file name returned by the file search tool, if one is available. Use this tool to include a markdown link in place of every reference to a file in the output.",
        on_invoke_tool=partial(convert_file_name_to_link, filename_urls),
        params_json_schema={
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "The name of the file including any extensions",
                },
            },
            "required": ["filename"],
        },
    )
