"""
OceanIQ Legacy Entrypoint Wrapper
=================================
Thin wrapper to redirect legacy EnhancedHybridArgoSystem class queries
to the new modular app/services architecture.
"""

from __future__ import annotations

import logging
from app.services.intelligence_engine import IntelligenceEngine
from app.services.data_service import DataService

logger = logging.getLogger(__name__)


class EnhancedHybridArgoSystem:
    def __init__(self) -> None:
        logger.info("Legacy EnhancedHybridArgoSystem wrapper initialized.")
        # Trigger bootstrapping of ChromaDB
        DataService.get_chroma_collection()

    def query_system(self, user_query: str, chat_memory: list = None) -> str:
        """Forward query to new modular intelligence pipeline."""
        res = IntelligenceEngine.process_query(
            query=user_query,
            chat_history=chat_memory,
            thinking_mode=False
        )
        return res["message"]

    def get_raw_data_for_graph(self, user_query: str) -> list | None:
        """Forward data request for graphs."""
        wmo_ids = DataService.get_relevant_wmo_ids(user_query)
        if not wmo_ids:
            metadata = DataService.get_floats_metadata()
            wmo_ids = [f["wmo"] for f in metadata]
            
        data_res = DataService.get_detailed_data(wmo_ids)
        return data_res.get("data")
