"""
OceanIQ Intelligence Engine
===========================
Orchestrates the query analysis pipeline:
1. Intent Classification (LLM-based with local fallback)
2. Geocoding / Bounding Box (OSM Nominatim)
3. Data Retrieval (PostgreSQL + ChromaDB)
4. Advanced Analytics (MLD, Thermocline, TS anomaly)
5. Web Search Fallback (DuckDuckGo)
6. Graph Generation (matplotlib legacy file-based)
7. Response Generation (Gemini/Groq with robust local statistical fallback)
"""

from __future__ import annotations

import logging
import os
from typing import Dict, Any, List, Generator
import pandas as pd
import numpy as np

from app.services.llm_service import LLMService
from app.services.intent_service import IntentService
from app.services.geocoder_service import GeocoderService
from app.services.data_service import DataService
from app.services.analysis_service import AnalysisService
from app.services.web_search_service import WebSearchService
from graphs import ArgoGraphGenerator
from app.utils.prompts import (
    RESPONSE_SYSTEM_PROMPT,
    THINKING_MODE_SYSTEM_PROMPT,
)
from app.utils.helpers import clean_nans

logger = logging.getLogger(__name__)


# Initialize graph generator
graph_generator = ArgoGraphGenerator(output_dir="./graphs")


class IntelligenceEngine:
    @classmethod
    def process_query(cls, query: str, chat_history: List[Dict[str, str]] = None, thinking_mode: bool = False) -> Dict[str, Any]:
        """
        Processes a user natural language query through the intelligence pipeline.
        Returns a dict containing:
        - 'message': text response (LLM or local statistical fallback)
        - 'graph_path': relative path to generated PNG graph (if any)
        - 'data': raw rows (for analytics views)
        - 'attribution': data source label
        """
        logger.info(f"Processing query: '{query}' (thinking_mode={thinking_mode})")
        chat_history = chat_history or []
        
        # Step 1: Classify query and extract filters
        classification = IntentService.classify_query(query)
        category = classification.get("category", "GENERAL_CHAT")
        extracted = classification.get("extracted", {})
        
        if category == "OFF_TOPIC":
            return {
                "message": "I am Aqua, your OceanIQ oceanographic assistant. I can only help you with questions related to oceans, ARGO floats, marine temperature, salinity, oxygen, and physical oceanography.",
                "graph_path": None,
                "data": None,
                "attribution": "System Guardrail"
            }
            
        # Conversational handler with automatic rerouting for ocean terms if LLM fails
        if category == "GENERAL_CHAT" and not extracted.get("wmo_ids") and not extracted.get("regions"):
            logger.info("Routing to general chat handler...")
            system_instruction = RESPONSE_SYSTEM_PROMPT + "\nAnswer general chat questions politely and briefly."
            history_context = ""
            for item in chat_history[-5:]:
                history_context += f"User: {item.get('question', '')}\nAI: {item.get('answer', '')}\n"
            user_prompt = f"{history_context}User: {query}"
            
            try:
                response = LLMService.generate_content(
                    system_prompt=system_instruction,
                    user_prompt=user_prompt
                )
                return {
                    "message": response,
                    "graph_path": None,
                    "data": None,
                    "attribution": "Aqua Conversational Model"
                }
            except Exception as e:
                logger.warning(f"LLM conversational generation failed: {e}. Checking for rerouting...")
                
                # If the query contains ocean keywords or WMO ID, force it to run the database query pipeline
                ocean_keywords = [
                    "temp", "salinity", "float", "argo", "pressure", "oxygen", "sea", "ocean", 
                    "bay", "bengal", "arabian", "mumbai", "lakshadweep", "wmo", "depth", "mld", 
                    "mixed layer", "thermocline", "density", "anomaly", "anomalies", "outlier", 
                    "outliers", "data", "measurement", "measurements", "record", "records"
                ]
                import re
                has_wmo_id = bool(re.search(r'\b\d{7}\b', query))
                if has_wmo_id or any(kw in query.lower() for kw in ocean_keywords):
                    logger.info("Oceanographic keyword or WMO ID found in failed chat. Rerouting to DATA_QUERY.")
                    category = "DATA_QUERY"
                else:
                    return {
                        "message": "### 🧠 Aqua Operating in Local Mode\n\nI am currently operating in offline mode. I can help you with oceanographic data queries, temperature/salinity profiles, or region lookups, which are processed locally on our edge database. Try asking a query like: *'Show me salinity in the Northern Bay of Bengal'*",
                        "graph_path": None,
                        "data": None,
                        "attribution": "⚙️ Local Guardrail"
                    }

        # Check if user is asking for a graph
        graph_keywords = ['plot', 'graph', 'chart', 'visualize']
        is_graph_request = category == "GRAPH" or any(kw in query.lower() for kw in graph_keywords)

        # Step 2: Extract spatial filters (Coordinates/Place name geocoding)
        location_filter = None
        coords = GeocoderService.parse_coordinates(query)
        if coords:
            location_filter = {
                "lat": coords["lat"],
                "lon": coords["lon"],
                "display_name": f"{coords['lat']:.2f}N, {coords['lon']:.2f}E"
            }
        else:
            regions = extracted.get("regions", [])
            if regions:
                place = regions[0]
                geocode_res = GeocoderService.geocode_place(place)
                if geocode_res:
                    location_filter = geocode_res

        # Step 3: Identify relevant WMO floats
        wmo_ids = extracted.get("wmo_ids", [])
        if not wmo_ids:
            if location_filter:
                closest_floats = DataService.search_profiles_by_location(
                    location_filter["lat"], location_filter["lon"]
                )
                wmo_ids = [str(f["wmo"]) for f in closest_floats]
            else:
                wmo_ids = DataService.get_relevant_wmo_ids(query)
                
        if not wmo_ids:
            metadata = DataService.get_floats_metadata()
            wmo_ids = [f["wmo"] for f in metadata]

        # Step 4: Retrieve data from PostgreSQL
        filters = {}
        if location_filter and "lat_min" in location_filter:
            filters["lat_range"] = (location_filter["lat_min"], location_filter["lat_max"])
            filters["lon_range"] = (location_filter["lon_min"], location_filter["lon_max"])
            
        time_period = extracted.get("time_period")
        if time_period and "start_date" in time_period:
            filters["date_range"] = (time_period["start_date"], time_period["end_date"])
            
        parameters = extracted.get("parameters", [])
        if parameters:
            filters["parameter_focus"] = parameters[0]
            
        data_res = DataService.get_detailed_data(wmo_ids, filters=filters)
        df = pd.DataFrame(data_res.get("data", []))

        # Check if we should generate a graph
        graph_path = None
        graph_json = None
        if is_graph_request and not df.empty:
            logger.info("Generating static chart using legacy graph engine...")
            raw_data = data_res.get("data", [])
            graph_path = graph_generator.generate_graph_from_data(query, raw_data)
            if graph_path:
                graph_path = f"graphs/{os.path.basename(graph_path)}"
                
            # Generate interactive Plotly JSON using GraphService
            try:
                from app.services.graph_service import GraphService
                gtype = graph_generator.determine_graph_type(query, df)
                if gtype == 'depth_profile':
                    graph_json = GraphService.generate_depth_profile(df)
                elif gtype == 'time_series':
                    param = parameters[0] if parameters else "temperature"
                    graph_json = GraphService.generate_time_series(df, parameter=param)
                elif gtype == 'scatter':
                    # Check if T-S diagram is requested
                    if "t-s" in query.lower() or "ts" in query.lower() or ("temperature" in query.lower() and "salinity" in query.lower()):
                        graph_json = GraphService.generate_ts_diagram(df)
                    else:
                        graph_json = GraphService.generate_ts_diagram(df)
                elif gtype == 'map':
                    graph_json = GraphService.generate_trajectory_map(df)
                elif "hovmoller" in query.lower() or "hovmüller" in query.lower() or "heatmap" in query.lower():
                    param = parameters[0] if parameters else "temperature"
                    graph_json = GraphService.generate_hovmoller(df, parameter=param)
                else:
                    graph_json = GraphService.generate_depth_profile(df)
            except Exception as ge:
                logger.error(f"Error generating Plotly interactive chart: {ge}")

        # Step 5: Web search fallback if database is empty
        if df.empty:
            logger.info("No matching database measurements found. Triggering web search fallback...")
            search_context = WebSearchService.search(query)
            
            system_prompt = RESPONSE_SYSTEM_PROMPT + "\nAnswer the user's question using the provided search context. Cite sources from the context."
            user_prompt = f"Search Context:\n{search_context}\n\nUser Question: {query}"
            
            try:
                response = LLMService.generate_content(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt
                )
                return {
                    "message": response,
                    "graph_path": None,
                    "data": None,
                    "attribution": "🔎 Web Search Context"
                }
            except Exception as e:
                logger.error(f"LLM web search synthesis failed: {e}")
                return {
                    "message": f"### 🔎 Web Search Results (AI Offline)\n\nI was unable to synthesize the web results using the LLM. Here are the raw search snippets retrieved:\n\n{search_context}",
                    "graph_path": None,
                    "data": None,
                    "attribution": "🔎 Raw Web Snippets"
                }

        # Step 6: Perform advanced analytics
        analytics_summary = ""
        if "thermocline" in query.lower():
            therm = AnalysisService.compute_thermocline_depth(df)
            if "error" not in therm:
                analytics_summary += f"\n- **Thermocline Depth:** {therm['avg_thermocline_depth_db']:.1f} dbar (Max gradient: {therm['max_gradient_c_db']:.3f}°C/dbar)"
        if "mixed layer" in query.lower() or "mld" in query.lower():
            mld = AnalysisService.compute_mixed_layer_depth(df)
            if "error" not in mld:
                analytics_summary += f"\n- **Mixed Layer Depth (MLD):** {mld['avg_mld_depth_db']:.1f} dbar (Surface reference temp: {mld['avg_surface_reference_temp_c']:.1f}°C)"
        if "anomaly" in query.lower() or "outlier" in query.lower():
            param = parameters[0] if parameters else "temperature"
            anom = AnalysisService.compute_anomalies(df, param)
            if "error" not in anom:
                analytics_summary += f"\n- **Z-Score Anomalies:** Found {anom['anomaly_count']} outliers for {param}."

        # Step 7: Construct statistics context
        stats_text = ""
        summary_sections = []
        
        wmo_list_str = ", ".join(wmo_ids)
        summary_sections.append(f"- **WMO Floats:** {wmo_list_str}")
        summary_sections.append(f"- **Total Records:** {len(df):,} measurements")
        
        if "temperature" in df.columns:
            temps = df["temperature"].dropna()
            if not temps.empty:
                stats_text += f"Temperature: range {temps.min():.2f}°C to {temps.max():.2f}°C, mean {temps.mean():.2f}°C\n"
                summary_sections.append(f"- **Temperature:** Range {temps.min():.1f}°C to {temps.max():.1f}°C (Mean: {temps.mean():.1f}°C)")
        if "salinity" in df.columns:
            sals = df["salinity"].dropna()
            if not sals.empty:
                stats_text += f"Salinity: range {sals.min():.2f} to {sals.max():.2f} PSU, mean {sals.mean():.2f} PSU\n"
                summary_sections.append(f"- **Salinity:** Range {sals.min():.1f} to {sals.max():.1f} PSU (Mean: {sals.mean():.1f} PSU)")
        if "pressure" in df.columns:
            pres = df["pressure"].dropna()
            if not pres.empty:
                stats_text += f"Pressure/Depth: range {pres.min():.2f} to {pres.max():.2f} dbar\n"
                summary_sections.append(f"- **Pressure/Depth Range:** {pres.min():.1f} to {pres.max():.1f} dbar")
                try:
                    df_clean = df.dropna(subset=["pressure"])
                    if not df_clean.empty:
                        # Find the most recent date with a complete vertical profile (multiple pressure levels)
                        date_counts = df_clean["profile_date"].value_counts()
                        valid_dates = date_counts[date_counts >= 5]
                        if not valid_dates.empty:
                            latest_date = sorted(list(valid_dates.index), reverse=True)[0]
                            latest_profile = df_clean[df_clean["profile_date"] == latest_date].sort_values("pressure")
                        else:
                            latest_date = df_clean["profile_date"].max()
                            latest_profile = df_clean[df_clean["profile_date"] == latest_date].sort_values("pressure")
                            
                        if len(latest_profile) > 1:
                            indices = np.linspace(0, len(latest_profile) - 1, min(8, len(latest_profile)), dtype=int)
                            sample_profile = latest_profile.iloc[indices]
                            stats_text += f"\nLATEST COMPLETED DEPTH PROFILE (Measured on {latest_date}):\n"
                            stats_text += "| Depth/Pressure (dbar) | Temperature (°C) | Salinity (PSU) |\n"
                            stats_text += "|---|---|---|\n"
                            for _, row in sample_profile.iterrows():
                                t_val = f"{row['temperature']:.2f}°C" if pd.notna(row.get('temperature')) else "N/A"
                                s_val = f"{row['salinity']:.2f} PSU" if pd.notna(row.get('salinity')) else "N/A"
                                stats_text += f"| {row['pressure']:.1f} | {t_val} | {s_val} |\n"
                except Exception as pe:
                    logger.error(f"Failed to generate profile stats text: {pe}")

        # Step 8: Call response generator with Local Fallback
        system_instruction = RESPONSE_SYSTEM_PROMPT
        if thinking_mode:
            system_instruction += "\n" + THINKING_MODE_SYSTEM_PROMPT
            
        history_context = "CHAT HISTORY:\n"
        for item in chat_history[-3:]:
            history_context += f"User: {item.get('question', '')}\nAI: {item.get('answer', '')}\n"
            
        user_prompt = f"""
{history_context}
DATA STATISTICS CONTEXT:
{stats_text}
{analytics_summary}

USER QUERY: {query}
"""

        try:
            response = LLMService.generate_content(
                system_prompt=system_instruction,
                user_prompt=user_prompt
            )
            attribution = f"📊 From our ARGO data ({len(df):,} measurements)"
        except Exception as e:
            logger.warning(f"All LLM providers failed ({e}). Falling back to local data synthesis.")
            
            local_summary = "\n".join(summary_sections)
            response = f"""### 📊 Data Synthesis (LLM Rate-Limited)

Our primary AI model is currently experiencing rate limits. A direct mathematical analysis of the matching PostgreSQL float profiles has been compiled:

{local_summary}
{analytics_summary}

*If you requested a plot or chart, it has been generated and rendered successfully below.*
"""
            attribution = f"⚙️ Edge Statistical Analysis ({len(df):,} measurements)"
            
        # Log interaction
        try:
            LLMService.log_interaction(query, response)
        except Exception:
            pass
            
        return clean_nans({
            "message": response,
            "graph_path": graph_path,
            "graph_json": graph_json,
            "data": df.head(100).to_dict("records"),
            "attribution": attribution
        })

    @classmethod
    def process_query_stream(cls, query: str, chat_history: List[Dict[str, str]] = None, thinking_mode: bool = False) -> Generator[str, None, None]:
        """
        Streams response tokens via SSE. Yields events:
        - metadata: json with graph_path, graph_json, data, attribution
        - text: text chunks
        - done: empty
        """
        import time
        import json
        logger.info(f"Processing query stream: '{query}' (thinking_mode={thinking_mode})")
        chat_history = chat_history or []
        
        # Step 1: Classify query and extract filters
        classification = IntentService.classify_query(query)
        category = classification.get("category", "GENERAL_CHAT")
        extracted = classification.get("extracted", {})
        
        if category == "OFF_TOPIC":
            off_topic_msg = "I am Aqua, your OceanIQ oceanographic assistant. I can only help you with questions related to oceans, ARGO floats, marine temperature, salinity, oxygen, and physical oceanography."
            yield f"event: metadata\ndata: {json.dumps({'graph_path': None, 'graph_json': None, 'attribution': 'System Guardrail'})}\n\n"
            yield f"event: text\ndata: {json.dumps(off_topic_msg)}\n\n"
            yield "event: done\ndata: \n\n"
            return
            
        # Conversational handler
        if category == "GENERAL_CHAT" and not extracted.get("wmo_ids") and not extracted.get("regions"):
            logger.info("Routing to general chat handler...")
            system_instruction = RESPONSE_SYSTEM_PROMPT + "\nAnswer general chat questions politely and briefly."
            history_context = ""
            for item in chat_history[-5:]:
                history_context += f"User: {item.get('question', '')}\nAI: {item.get('answer', '')}\n"
            user_prompt = f"{history_context}User: {query}"
            
            yield f"event: metadata\ndata: {json.dumps({'graph_path': None, 'graph_json': None, 'attribution': 'Aqua Conversational Model'})}\n\n"
            
            try:
                stream_gen = LLMService.generate_content(
                    system_prompt=system_instruction,
                    user_prompt=user_prompt,
                    stream=True
                )
                full_resp = []
                for chunk in stream_gen:
                    full_resp.append(chunk)
                    yield f"event: text\ndata: {json.dumps(chunk)}\n\n"
                # Log interaction
                try:
                    LLMService.log_interaction(query, "".join(full_resp))
                except Exception:
                    pass
                yield "event: done\ndata: \n\n"
                return
            except Exception as e:
                logger.warning(f"LLM conversational generation failed: {e}. Checking for rerouting...")
                ocean_keywords = [
                    "temp", "salinity", "float", "argo", "pressure", "oxygen", "sea", "ocean", 
                    "bay", "bengal", "arabian", "mumbai", "lakshadweep", "wmo", "depth", "mld", 
                    "mixed layer", "thermocline", "density", "anomaly", "anomalies", "outlier", 
                    "outliers", "data", "measurement", "measurements", "record", "records"
                ]
                import re
                has_wmo_id = bool(re.search(r'\b\d{7}\b', query))
                if has_wmo_id or any(kw in query.lower() for kw in ocean_keywords):
                    category = "DATA_QUERY"
                else:
                    msg = "### 🧠 Aqua Operating in Local Mode\n\nI am currently operating in offline mode. I can help you with oceanographic data queries, temperature/salinity profiles, or region lookups, which are processed locally on our edge database. Try asking a query like: *'Show me salinity in the Northern Bay of Bengal'*"
                    yield f"event: text\ndata: {json.dumps(msg)}\n\n"
                    yield "event: done\ndata: \n\n"
                    return

        # Check if user is asking for a graph
        graph_keywords = ['plot', 'graph', 'chart', 'visualize']
        is_graph_request = category == "GRAPH" or any(kw in query.lower() for kw in graph_keywords)

        # Step 2: Extract spatial filters
        location_filter = None
        coords = GeocoderService.parse_coordinates(query)
        if coords:
            location_filter = {
                "lat": coords["lat"],
                "lon": coords["lon"],
                "display_name": f"{coords['lat']:.2f}N, {coords['lon']:.2f}E"
            }
        else:
            regions = extracted.get("regions", [])
            if regions:
                place = regions[0]
                geocode_res = GeocoderService.geocode_place(place)
                if geocode_res:
                    location_filter = geocode_res

        # Step 3: Identify relevant WMO floats
        wmo_ids = extracted.get("wmo_ids", [])
        if not wmo_ids:
            if location_filter:
                closest_floats = DataService.search_profiles_by_location(
                    location_filter["lat"], location_filter["lon"]
                )
                wmo_ids = [str(f["wmo"]) for f in closest_floats]
            else:
                wmo_ids = DataService.get_relevant_wmo_ids(query)
                
        if not wmo_ids:
            metadata = DataService.get_floats_metadata()
            wmo_ids = [f["wmo"] for f in metadata]

        # Step 4: Retrieve data from PostgreSQL
        filters = {}
        if location_filter and "lat_min" in location_filter:
            filters["lat_range"] = (location_filter["lat_min"], location_filter["lat_max"])
            filters["lon_range"] = (location_filter["lon_min"], location_filter["lon_max"])
            
        time_period = extracted.get("time_period")
        if time_period and "start_date" in time_period:
            filters["date_range"] = (time_period["start_date"], time_period["end_date"])
            
        parameters = extracted.get("parameters", [])
        if parameters:
            filters["parameter_focus"] = parameters[0]
            
        data_res = DataService.get_detailed_data(wmo_ids, filters=filters)
        df = pd.DataFrame(data_res.get("data", []))

        # Check if we should generate a graph
        graph_path = None
        graph_json = None
        if is_graph_request and not df.empty:
            logger.info("Generating static chart using legacy graph engine...")
            raw_data = data_res.get("data", [])
            graph_path = graph_generator.generate_graph_from_data(query, raw_data)
            if graph_path:
                graph_path = f"graphs/{os.path.basename(graph_path)}"
                
            # Generate interactive Plotly JSON using GraphService
            try:
                from app.services.graph_service import GraphService
                gtype = graph_generator.determine_graph_type(query, df)
                if gtype == 'depth_profile':
                    graph_json = GraphService.generate_depth_profile(df)
                elif gtype == 'time_series':
                    param = parameters[0] if parameters else "temperature"
                    graph_json = GraphService.generate_time_series(df, parameter=param)
                elif gtype == 'scatter':
                    if "t-s" in query.lower() or "ts" in query.lower() or ("temperature" in query.lower() and "salinity" in query.lower()):
                        graph_json = GraphService.generate_ts_diagram(df)
                    else:
                        graph_json = GraphService.generate_ts_diagram(df)
                elif gtype == 'map':
                    graph_json = GraphService.generate_trajectory_map(df)
                elif "hovmoller" in query.lower() or "hovmüller" in query.lower() or "heatmap" in query.lower():
                    param = parameters[0] if parameters else "temperature"
                    graph_json = GraphService.generate_hovmoller(df, parameter=param)
                else:
                    graph_json = GraphService.generate_depth_profile(df)
            except Exception as ge:
                logger.error(f"Error generating Plotly interactive chart: {ge}")

        # Step 5: Web search fallback if database is empty
        if df.empty:
            logger.info("No matching database measurements found. Triggering web search fallback...")
            search_context = WebSearchService.search(query)
            
            yield f"event: metadata\ndata: {json.dumps({'graph_path': None, 'graph_json': None, 'attribution': '🔎 Web Search Context'})}\n\n"
            
            system_prompt = RESPONSE_SYSTEM_PROMPT + "\nAnswer the user's question using the provided search context. Cite sources from the context."
            user_prompt = f"Search Context:\n{search_context}\n\nUser Question: {query}"
            
            try:
                stream_gen = LLMService.generate_content(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    stream=True
                )
                full_resp = []
                for chunk in stream_gen:
                    full_resp.append(chunk)
                    yield f"event: text\ndata: {json.dumps(chunk)}\n\n"
                try:
                    LLMService.log_interaction(query, "".join(full_resp))
                except Exception:
                    pass
                yield "event: done\ndata: \n\n"
                return
            except Exception as e:
                logger.error(f"LLM web search synthesis failed: {e}")
                err_msg = f"### 🔎 Web Search Results (AI Offline)\n\nI was unable to synthesize the web results using the LLM. Here are the raw search snippets retrieved:\n\n{search_context}"
                yield f"event: text\ndata: {json.dumps(err_msg)}\n\n"
                yield "event: done\ndata: \n\n"
                return

        # Step 6: Perform advanced analytics
        analytics_summary = ""
        if "thermocline" in query.lower():
            therm = AnalysisService.compute_thermocline_depth(df)
            if "error" not in therm:
                analytics_summary += f"\n- **Thermocline Depth:** {therm['avg_thermocline_depth_db']:.1f} dbar (Max gradient: {therm['max_gradient_c_db']:.3f}°C/dbar)"
        if "mixed layer" in query.lower() or "mld" in query.lower():
            mld = AnalysisService.compute_mixed_layer_depth(df)
            if "error" not in mld:
                analytics_summary += f"\n- **Mixed Layer Depth (MLD):** {mld['avg_mld_depth_db']:.1f} dbar (Surface reference temp: {mld['avg_surface_reference_temp_c']:.1f}°C)"
        if "anomaly" in query.lower() or "outlier" in query.lower():
            param = parameters[0] if parameters else "temperature"
            anom = AnalysisService.compute_anomalies(df, param)
            if "error" not in anom:
                analytics_summary += f"\n- **Z-Score Anomalies:** Found {anom['anomaly_count']} outliers for {param}."

        # Step 7: Construct statistics context
        stats_text = ""
        summary_sections = []
        wmo_list_str = ", ".join(wmo_ids)
        summary_sections.append(f"- **WMO Floats:** {wmo_list_str}")
        summary_sections.append(f"- **Total Records:** {len(df):,} measurements")
        
        if "temperature" in df.columns:
            temps = df["temperature"].dropna()
            if not temps.empty:
                stats_text += f"Temperature: range {temps.min():.2f}°C to {temps.max():.2f}°C, mean {temps.mean():.2f}°C\n"
                summary_sections.append(f"- **Temperature:** Range {temps.min():.1f}°C to {temps.max():.1f}°C (Mean: {temps.mean():.1f}°C)")
        if "salinity" in df.columns:
            sals = df["salinity"].dropna()
            if not sals.empty:
                stats_text += f"Salinity: range {sals.min():.2f} to {sals.max():.2f} PSU, mean {sals.mean():.2f} PSU\n"
                summary_sections.append(f"- **Salinity:** Range {sals.min():.1f} to {sals.max():.1f} PSU (Mean: {sals.mean():.1f} PSU)")
        if "pressure" in df.columns:
            pres = df["pressure"].dropna()
            if not pres.empty:
                stats_text += f"Pressure/Depth: range {pres.min():.2f} to {pres.max():.2f} dbar\n"
                summary_sections.append(f"- **Pressure/Depth Range:** {pres.min():.1f} to {pres.max():.1f} dbar")
                try:
                    df_clean = df.dropna(subset=["pressure"])
                    if not df_clean.empty:
                        # Find the most recent date with a complete vertical profile (multiple pressure levels)
                        date_counts = df_clean["profile_date"].value_counts()
                        valid_dates = date_counts[date_counts >= 5]
                        if not valid_dates.empty:
                            latest_date = sorted(list(valid_dates.index), reverse=True)[0]
                            latest_profile = df_clean[df_clean["profile_date"] == latest_date].sort_values("pressure")
                        else:
                            latest_date = df_clean["profile_date"].max()
                            latest_profile = df_clean[df_clean["profile_date"] == latest_date].sort_values("pressure")
                            
                        if len(latest_profile) > 1:
                            indices = np.linspace(0, len(latest_profile) - 1, min(8, len(latest_profile)), dtype=int)
                            sample_profile = latest_profile.iloc[indices]
                            stats_text += f"\nLATEST COMPLETED DEPTH PROFILE (Measured on {latest_date}):\n"
                            stats_text += "| Depth/Pressure (dbar) | Temperature (°C) | Salinity (PSU) |\n"
                            stats_text += "|---|---|---|\n"
                            for _, row in sample_profile.iterrows():
                                t_val = f"{row['temperature']:.2f}°C" if pd.notna(row.get('temperature')) else "N/A"
                                s_val = f"{row['salinity']:.2f} PSU" if pd.notna(row.get('salinity')) else "N/A"
                                stats_text += f"| {row['pressure']:.1f} | {t_val} | {s_val} |\n"
                except Exception as pe:
                    logger.error(f"Failed to generate profile stats text: {pe}")

        # Step 8: Call response generator with Local Fallback
        system_instruction = RESPONSE_SYSTEM_PROMPT
        if thinking_mode:
            system_instruction += "\n" + THINKING_MODE_SYSTEM_PROMPT
            
        history_context = "CHAT HISTORY:\n"
        for item in chat_history[-3:]:
            history_context += f"User: {item.get('question', '')}\nAI: {item.get('answer', '')}\n"
            
        user_prompt = f"""
{history_context}
DATA STATISTICS CONTEXT:
{stats_text}
{analytics_summary}

USER QUERY: {query}
"""

        # Yield metadata event
        meta_payload = clean_nans({
            "graph_path": graph_path,
            "graph_json": graph_json,
            "attribution": f"📊 From our ARGO data ({len(df):,} measurements)",
            "data": df.head(100).to_dict("records")
        })
        
        try:
            # Try to get stream generator
            stream_gen = LLMService.generate_content(
                system_prompt=system_instruction,
                user_prompt=user_prompt,
                stream=True
            )
            # Yield metadata first
            yield f"event: metadata\ndata: {json.dumps(meta_payload)}\n\n"
            
            full_resp = []
            for chunk in stream_gen:
                full_resp.append(chunk)
                yield f"event: text\ndata: {json.dumps(chunk)}\n\n"
                
            try:
                LLMService.log_interaction(query, "".join(full_resp))
            except Exception:
                pass
        except Exception as e:
            logger.warning(f"All LLM providers failed for stream ({e}). Falling back to local data synthesis.")
            meta_payload["attribution"] = f"⚙️ Edge Statistical Analysis ({len(df):,} measurements)"
            yield f"event: metadata\ndata: {json.dumps(meta_payload)}\n\n"
            
            local_summary = "\n".join(summary_sections)
            response = f"""### 📊 Data Synthesis (LLM Rate-Limited)

Our primary AI model is currently experiencing rate limits. A direct mathematical analysis of the matching PostgreSQL float profiles has been compiled:

{local_summary}
{analytics_summary}

*If you requested a plot or chart, it has been generated and rendered successfully below.*
"""
            # Stream the fallback response token by token or in small chunks
            for word in response.split(" "):
                yield f"event: text\ndata: {json.dumps(word + ' ')}\n\n"
                time.sleep(0.01) # small sleep to simulate streaming typing
                
            try:
                LLMService.log_interaction(query, response)
            except Exception:
                pass

        yield "event: done\ndata: \n\n"

