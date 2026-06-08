"""
OceanIQ Intent Service
======================
Handles query intent classification using the LLM.
"""

from __future__ import annotations

import json
import logging
from typing import Dict, Any

from app.services.llm_service import LLMService
from app.utils.prompts import INTENT_CLASSIFICATION_PROMPT

logger = logging.getLogger(__name__)


class IntentService:
    @classmethod
    def classify_query(cls, query: str) -> Dict[str, Any]:
        """
        Classifies a user query to determine its intent category and extract
        associated metadata filters.
        """
        logger.info(f"Classifying user query: {query}")
        
        system_prompt = "You are a specialized metadata extractor. Respond ONLY with raw, valid JSON."
        user_prompt = INTENT_CLASSIFICATION_PROMPT.replace("{query}", query)
        
        try:
            # Call primary LLM (Gemini) to get structured classification
            raw_response = LLMService.generate_content(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                provider="gemini",  # Explicitly use gemini for classification
                stream=False
            )
            
            # Clean response text (remove code blocks if LLM included them)
            cleaned = str(raw_response).strip()
            if cleaned.startswith("```"):
                # strip out markdown block wrapper
                lines = cleaned.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                cleaned = "\n".join(lines).strip()
                
            result = json.loads(cleaned)
            logger.info(f"Classification result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Intent classification failed: {e}. Falling back to rule-based local extractor.")
            
            # Rule-based fallback extraction
            import re
            
            # 1. Extract WMO IDs (7-digit numbers)
            wmo_ids = re.findall(r'\b\d{7}\b', query)
            
            # 2. Extract regions
            regions = []
            q_lower = query.lower()
            if "arabian" in q_lower:
                regions.append("Arabian Sea")
            if "bengal" in q_lower:
                regions.append("Bay of Bengal")
            if "indian" in q_lower:
                regions.append("Indian Ocean")
                
            # 3. Extract parameters
            parameters = []
            if "temp" in q_lower:
                parameters.append("temperature")
            if "salinity" in q_lower or "salt" in q_lower:
                parameters.append("salinity")
            if "pressure" in q_lower or "depth" in q_lower or "press" in q_lower:
                parameters.append("pressure")
            if "oxygen" in q_lower or "oxy" in q_lower:
                parameters.append("oxygen")
                
            # 4. Determine category
            category = "GENERAL_CHAT"
            graph_keywords = ['plot', 'graph', 'chart', 'visualize']
            data_keywords = [
                "data", "measurement", "measurements", "record", "records", "mld", "mixed layer", 
                "thermocline", "anomaly", "anomalies", "outlier", "outliers", "mean", "average", 
                "compare", "calculate", "stat", "stats", "statistics", "value", "values"
            ]
            
            if any(kw in q_lower for kw in graph_keywords):
                category = "GRAPH"
            elif wmo_ids or regions or parameters or any(kw in q_lower for kw in data_keywords):
                category = "DATA_QUERY"
                
            # 5. Extract time period
            time_period = None
            
            fallback_res = {
                "category": category,
                "extracted": {
                    "wmo_ids": wmo_ids,
                    "parameters": parameters,
                    "regions": regions,
                    "time_period": time_period,
                    "aggregation": None,
                    "graph_type": None
                }
            }
            logger.info(f"Rule-based classification fallback result: {fallback_res}")
            return fallback_res
