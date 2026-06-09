"""
OceanIQ Data Service
====================
Handles database interactions for OceanIQ:
1. PostgreSQL queries for ARGO float levels/measurements.
2. ChromaDB vector queries for semantic search and metadata lookup.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from chromadb import PersistentClient
from chromadb.utils.embedding_functions import GoogleGenerativeAiEmbeddingFunction
import json
import os
import time

from app.config import (
    POSTGRES_URL,
    CHROMA_PATH,
    COLLECTION_NAME,
    REGION_DEFINITIONS,
    GEMINI_API_KEY,
)

logger = logging.getLogger(__name__)


class DataService:
    # Class-level caches
    _chroma_client: PersistentClient | None = None
    _collection: Any = None
    _metadata_cache: List[Dict[str, Any]] | None = None
    _metadata_cache_time: float = 0
    _gemini_ef: GoogleGenerativeAiEmbeddingFunction | None = None

    @classmethod
    def get_embedding_function(cls) -> GoogleGenerativeAiEmbeddingFunction:
        if cls._gemini_ef is None:
            if not GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY environment variable is required for ChromaDB embeddings.")
            cls._gemini_ef = GoogleGenerativeAiEmbeddingFunction(api_key=GEMINI_API_KEY, model_name="models/text-embedding-004")
        return cls._gemini_ef

    @classmethod
    def get_chroma_collection(cls) -> Any:
        """Lazy load the ChromaDB persistent client and collection."""
        if cls._chroma_client is None:
            logger.info(f"Connecting to ChromaDB at: {CHROMA_PATH}")
            cls._chroma_client = PersistentClient(path=CHROMA_PATH)
            ef = cls.get_embedding_function()
            try:
                cls._collection = cls._chroma_client.get_collection(name=COLLECTION_NAME, embedding_function=ef)
            except Exception:
                logger.info(f"Collection {COLLECTION_NAME} not found. Creating it...")
                cls._collection = cls._chroma_client.create_collection(name=COLLECTION_NAME, embedding_function=ef)
                cls._bootstrap_chroma_metadata()
        return cls._collection

    @classmethod
    def get_connection(cls):
        """Creates and returns a new connection to PostgreSQL."""
        if not POSTGRES_URL:
            raise ValueError("POSTGRES_URL environment variable is missing.")
        return psycopg2.connect(POSTGRES_URL)

    @classmethod
    def get_relevant_wmo_ids(cls, query_text: str) -> List[str]:
        """
        Uses ChromaDB semantic search to retrieve float WMO IDs related to the query.
        """
        try:
            collection = cls.get_chroma_collection()
            results = collection.query(query_texts=[query_text], n_results=10)
            if not results or not results["metadatas"] or not results["metadatas"][0]:
                return []
            
            wmo_ids = []
            for meta in results["metadatas"][0]:
                if meta and "wmo" in meta:
                    wmo_ids.append(str(meta["wmo"]).split(".")[0])
            return list(set(wmo_ids))
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            return []

    @classmethod
    def search_profiles_by_location(cls, lat: float, lon: float, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Finds the floats closest geographically to the given latitude and longitude.
        """
        try:
            collection = cls.get_chroma_collection()
            all_floats = collection.get(include=["metadatas"])
            if not all_floats or not all_floats["metadatas"]:
                return []
                
            distances = []
            seen_wmos = set()
            for meta in all_floats["metadatas"]:
                wmo = meta.get("wmo")
                if not wmo or wmo in seen_wmos:
                    continue
                profile_lat = meta.get("avg_latitude", 0.0)
                profile_lon = meta.get("avg_longitude", 0.0)
                
                # Simple Euclidean distance as a proxy
                dist = np.sqrt((lat - profile_lat)**2 + (lon - profile_lon)**2)
                distances.append((dist, meta))
                seen_wmos.add(wmo)
                
            distances.sort(key=lambda x: x[0])
            return [meta for dist, meta in distances[:n_results]]
        except Exception as e:
            logger.error(f"Error in proximity location search: {e}")
            return []

    @classmethod
    def get_detailed_data(cls, wmo_ids: List[str], filters: Dict[str, Any] = None, limit: int = 8000) -> Dict[str, Any]:
        """
        Fetches detailed measurements for specified WMOs from PostgreSQL,
        applying filters such as date ranges and parameter focus.
        """
        if not wmo_ids:
            return {"data": [], "count": 0}
            
        clean_wmos = [str(w).strip().split(".")[0] for w in wmo_ids if w]
        if not clean_wmos:
            return {"data": [], "count": 0}
            
        wmo_list = "','".join(clean_wmos)
        
        try:
            with cls.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Discover available columns dynamically
                    cur.execute("""
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'argo_profiles'
                    """)
                    columns = [row["column_name"] for row in cur.fetchall()]
                    
                    select_exprs = ["wmo"]
                    column_map = {
                        "profile_date": "profile_date",
                        "cycle_number": "cycle_number",
                        "latitude": "latitude",
                        "longitude": "longitude",
                        "temp": "temp AS temperature",
                        "pres": "pres AS pressure",
                        "psal": "psal AS salinity",
                        "doxy_umolkg": "doxy_umolkg AS dissolved_oxygen"
                    }
                    
                    for col, alias in column_map.items():
                        if col in columns:
                            select_exprs.append(alias)
                            
                    query = f"""
                        SELECT {', '.join(select_exprs)}
                        FROM argo_profiles
                        WHERE wmo IN ('{wmo_list}')
                    """
                    
                    where_clauses = []
                    if "temp" in columns:
                        where_clauses.append("temp IS NOT NULL")
                    if "pres" in columns:
                        where_clauses.append("pres IS NOT NULL")
                        
                    if filters:
                        if "date_range" in filters:
                            start_date, end_date = filters["date_range"]
                            where_clauses.append(f"profile_date BETWEEN '{start_date}' AND '{end_date}'")
                            
                        # Add parameter-specific filters if specified
                        if filters.get("parameter_focus") == "temperature" and "temp" in columns:
                            where_clauses.append("temp IS NOT NULL")
                        elif filters.get("parameter_focus") == "salinity" and "psal" in columns:
                            where_clauses.append("psal IS NOT NULL")
                        elif filters.get("parameter_focus") == "oxygen" and "doxy_umolkg" in columns:
                            where_clauses.append("doxy_umolkg IS NOT NULL")
                            
                    if where_clauses:
                        query += " AND " + " AND ".join(where_clauses)
                        
                    query += f" ORDER BY wmo, profile_date, pres LIMIT {limit}"
                    
                    cur.execute(query)
                    rows = cur.fetchall()
                    
                    if not rows:
                        return {"data": [], "count": 0}
                        
                    # Process rows into pandas dataframe for cleaning and conversion
                    df = pd.DataFrame(rows)
                    
                    # Convert numeric columns properly
                    numeric_cols = ["temperature", "pressure", "salinity", "dissolved_oxygen", "latitude", "longitude"]
                    for col in numeric_cols:
                        if col in df.columns:
                            df[col] = pd.to_numeric(df[col], errors="coerce")
                            
                    # Remove date tz if present for serialization
                    if "profile_date" in df.columns:
                        df["profile_date"] = df["profile_date"].astype(str)
                        
                    return {
                        "data": df.to_dict("records"),
                        "count": len(df)
                    }
        except Exception as e:
            logger.error(f"Error fetching data from PostgreSQL: {e}")
            return {"error": str(e), "data": [], "count": 0}

    @classmethod
    def get_floats_metadata(cls) -> List[Dict[str, Any]]:
        """
        Retrieves summary metadata for all unique floats in the PostgreSQL database.
        """
        cache_file = os.path.join(os.path.dirname(__file__), "float_metadata_cache.json")
        
        # Check in-memory cache first
        if cls._metadata_cache is not None and (time.time() - cls._metadata_cache_time) < 3600:
            return cls._metadata_cache
            
        # Check on-disk cache next (valid for 24 hours)
        if os.path.exists(cache_file):
            if (time.time() - os.path.getmtime(cache_file)) < 86400:
                try:
                    with open(cache_file, "r") as f:
                        cached_data = json.load(f)
                        cls._metadata_cache = cached_data
                        cls._metadata_cache_time = time.time()
                        return cached_data
                except Exception as e:
                    logger.warning(f"Failed to read cache file: {e}")
            
        try:
            with cls.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT wmo,
                               COUNT(*) as total_measurements,
                               MIN(profile_date) as first_profile,
                               MAX(profile_date) as last_profile,
                               AVG(NULLIF(latitude, '')::DOUBLE PRECISION) as avg_lat,
                               AVG(NULLIF(longitude, '')::DOUBLE PRECISION) as avg_lon,
                               AVG(NULLIF(temp, '')::DOUBLE PRECISION) as avg_temp,
                               AVG(NULLIF(psal, '')::DOUBLE PRECISION) as avg_sal
                        FROM argo_profiles
                        GROUP BY wmo
                        ORDER BY wmo
                    """)
                    rows = cur.fetchall()
                    
                    # First pass: calculate region averages for fallback
                    region_temps = {}
                    region_sals = {}
                    parsed_rows = []
                    
                    for row in rows:
                        lat = float(row["avg_lat"]) if row["avg_lat"] else 0.0
                        lon = float(row["avg_lon"]) if row["avg_lon"] else 0.0
                        
                        # Determine region based on coordinates
                        region = "Indian Ocean (General)"
                        for name, bounds in REGION_DEFINITIONS.items():
                            lat_range = bounds["lat"]
                            lon_range = bounds["lon"]
                            if lat_range[0] <= lat <= lat_range[1] and lon_range[0] <= lon <= lon_range[1]:
                                region = name
                                break
                        
                        avg_temp = float(row["avg_temp"]) if row["avg_temp"] else None
                        avg_sal = float(row["avg_sal"]) if row["avg_sal"] else None
                        
                        if avg_temp is not None:
                            region_temps.setdefault(region, []).append(avg_temp)
                        if avg_sal is not None:
                            region_sals.setdefault(region, []).append(avg_sal)
                            
                        parsed_rows.append({
                            "row": row,
                            "lat": lat,
                            "lon": lon,
                            "region": region,
                            "avg_temp": avg_temp,
                            "avg_sal": avg_sal
                        })
                        
                    # Calculate average values per region
                    region_avg_temp = {r: sum(ts)/len(ts) for r, ts in region_temps.items() if ts}
                    region_avg_sal = {r: sum(ss)/len(ss) for r, ss in region_sals.items() if ss}
                    
                    # Global fallbacks if a region has no core data at all
                    all_temps = [t for ts in region_temps.values() for t in ts]
                    all_sals = [s for ss in region_sals.values() for s in ss]
                    global_avg_temp = sum(all_temps)/len(all_temps) if all_temps else 15.0
                    global_avg_sal = sum(all_sals)/len(all_sals) if all_sals else 34.5
                    
                    result = []
                    for pr in parsed_rows:
                        row = pr["row"]
                        region = pr["region"]
                        avg_temp = pr["avg_temp"]
                        avg_sal = pr["avg_sal"]
                        
                        # Apply fallback values if missing
                        if avg_temp is None:
                            avg_temp = region_avg_temp.get(region, global_avg_temp)
                        if avg_sal is None:
                            avg_sal = region_avg_sal.get(region, global_avg_sal)
                            
                        result.append({
                            "wmo": row["wmo"],
                            "measurements_count": row["total_measurements"],
                            "first_profile": str(row["first_profile"]),
                            "last_profile": str(row["last_profile"]),
                            "avg_latitude": pr["lat"],
                            "avg_longitude": pr["lon"],
                            "avg_temp": avg_temp,
                            "avg_sal": avg_sal,
                            "region": region,
                            "active": "Active" if "2024" in str(row["last_profile"]) or "2025" in str(row["last_profile"]) or "2026" in str(row["last_profile"]) else "Inactive"
                        })
                    cls._metadata_cache = result
                    cls._metadata_cache_time = time.time()
                    
                    # Save to disk
                    try:
                        with open(cache_file, "w") as f:
                            json.dump(result, f)
                    except Exception as e:
                        logger.warning(f"Failed to write cache file: {e}")
                        
                    return result
        except Exception as e:
            logger.error(f"Error fetching floats metadata: {e}")
            return []

    @classmethod
    def _bootstrap_chroma_metadata(cls) -> None:
        """
        Populate ChromaDB with initial float descriptive documents for semantic matching.
        """
        logger.info("Bootstrapping ChromaDB metadata records...")
        
        # Hardcoded description mappings for the 5 key floats
        float_metadata = [
            {
                "wmo": "2902210",
                "avg_lat": 17.83,
                "avg_long": 67.70,
                "n_profiles": 247,
                "desc": "ARGO float WMO 2902210 is located in the Northern Arabian Sea (17.83N, 67.70E). It measures temperature, salinity, and pressure, capturing seasonal variations influenced by the Indian Monsoon and high evaporation rates in the northern basin."
            },
            {
                "wmo": "2902217",
                "avg_lat": 17.30,
                "avg_long": 89.72,
                "n_profiles": 169,
                "desc": "ARGO float WMO 2902217 is located in the Northern Bay of Bengal (17.30N, 89.72E). It monitors fresh river runoff from the Ganges-Brahmaputra system, showing lower sea surface salinity and strong density stratification."
            },
            {
                "wmo": "2901092",
                "avg_lat": -2.16,
                "avg_long": 93.86,
                "n_profiles": 188,
                "desc": "ARGO float WMO 2901092 operates in the Equatorial Indian Ocean (-2.16S, 93.86E). It collects data on equatorial current systems, temperature trends, and deep water mass characteristics in the central tropical region."
            },
            {
                "wmo": "1902677",
                "avg_lat": -10.54,
                "avg_long": 78.11,
                "n_profiles": 61,
                "desc": "ARGO float WMO 1902677 traverses the Southern Indian Ocean (-10.54S, 78.11E). It observes the subtropical oceanographic dynamics, cooler sub-Antarctic water incursions, and salinity variations in the southern subtropical gyre."
            },
            {
                "wmo": "2900230",
                "avg_lat": -1.80,
                "avg_long": 71.49,
                "n_profiles": 122,
                "desc": "ARGO float WMO 2900230 floats in the Central Arabian Sea (-1.80S, 71.49E). It provides core vertical profiles of salinity and temperature, reflecting ocean-atmosphere interactions, Arabian Sea High Salinity Water formation, and circulation."
            }
        ]
        
        documents = []
        metadatas = []
        ids = []
        
        for item in float_metadata:
            ids.append(f"argo_wmo_{item['wmo']}")
            documents.append(item["desc"])
            metadatas.append({
                "wmo": item["wmo"],
                "avg_latitude": item["avg_lat"],
                "avg_longitude": item["avg_long"],
                "n_profiles": item["n_profiles"],
                "ocean_basin": "Arabian Sea" if "Arabian" in item["desc"] else ("Bay of Bengal" if "Bengal" in item["desc"] else "Indian Ocean")
            })
            
        cls._collection.add(documents=documents, metadatas=metadatas, ids=ids)
        logger.info("ChromaDB bootstrapped successfully.")
