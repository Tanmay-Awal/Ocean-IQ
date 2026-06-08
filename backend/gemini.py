"""
OceanIQ Legacy Thinking Wrapper
===============================
Thin wrapper to redirect legacy GeminiThinkingSystem class queries
to the new modular app/services architecture in thinking mode.
"""

from __future__ import annotations

import logging
from app.services.intelligence_engine import IntelligenceEngine

logger = logging.getLogger(__name__)


class GeminiThinkingSystem:
    def __init__(self, argo_system_instance=None) -> None:
        logger.info("Legacy GeminiThinkingSystem wrapper initialized.")

    def query_system_thinking_mode(self, user_query: str, chat_memory: list = None) -> str:
        """Forward query to new modular intelligence pipeline in thinking mode."""
        res = IntelligenceEngine.process_query(
            query=user_query,
            chat_history=chat_memory,
            thinking_mode=True
        )
        return res["message"]