"""
OceanIQ Web Search Service
==========================
Uses DuckDuckGo to search the web as a fallback for queries outside our dataset.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class WebSearchService:
    @classmethod
    def search(cls, query: str, max_results: int = 5) -> str:
        """
        Performs a search on DuckDuckGo and returns a text summary of snippets.
        """
        logger.info(f"Performing DuckDuckGo search for: '{query}'")
        try:
            from duckduckgo_search import DDGS
            
            snippets: List[str] = []
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
                for idx, r in enumerate(results, 1):
                    title = r.get("title", "No Title")
                    body = r.get("body", "")
                    href = r.get("href", "#")
                    snippets.append(f"[{idx}] {title}\nSource: {href}\nContent: {body}\n")
                    
            if not snippets:
                return "No web search results found."
                
            return "\n".join(snippets)
            
        except Exception as e:
            logger.error(f"DuckDuckGo search failed: {e}")
            return f"Failed to retrieve web search results due to an error: {e}"
