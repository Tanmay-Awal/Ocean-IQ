"""
Enrich ChromaDB Embeddings for OceanIQ
======================================
Queries PostgreSQL database for actual stats on each WMO float,
generates multiple semantic documents per float, and stores them in ChromaDB.
"""

from __future__ import annotations

import os
import sys

# Configure UTF-8 encoding for Windows console redirection
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import psycopg2
from psycopg2.extras import RealDictCursor
import chromadb
from chromadb import PersistentClient

# Add parent directory to path to allow imports from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import POSTGRES_URL, CHROMA_PATH, COLLECTION_NAME, REGION_DEFINITIONS

def get_db_stats():
    """Fetches descriptive stats for each WMO float in PostgreSQL."""
    print("[DB] Connecting to PostgreSQL...")
    conn = psycopg2.connect(POSTGRES_URL)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # First, check if the table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'argo_profiles'
                );
            """)
            if not cur.fetchone()['exists']:
                print("❌ Table argo_profiles does not exist!")
                return []
                
            cur.execute("""
                SELECT wmo,
                       COUNT(*) as total_measurements,
                       MIN(profile_date) as first_profile,
                       MAX(profile_date) as last_profile,
                       AVG(NULLIF(latitude, '')::DOUBLE PRECISION) as avg_lat,
                       AVG(NULLIF(longitude, '')::DOUBLE PRECISION) as avg_lon,
                       MIN(NULLIF(temp, '')::DOUBLE PRECISION) as min_temp,
                       MAX(NULLIF(temp, '')::DOUBLE PRECISION) as max_temp,
                       AVG(NULLIF(temp, '')::DOUBLE PRECISION) as avg_temp,
                       MIN(NULLIF(psal, '')::DOUBLE PRECISION) as min_sal,
                       MAX(NULLIF(psal, '')::DOUBLE PRECISION) as max_sal,
                       AVG(NULLIF(psal, '')::DOUBLE PRECISION) as avg_sal,
                       MIN(NULLIF(pres, '')::DOUBLE PRECISION) as min_pres,
                       MAX(NULLIF(pres, '')::DOUBLE PRECISION) as max_pres
                FROM argo_profiles
                GROUP BY wmo
                ORDER BY wmo
            """)
            return cur.fetchall()
    finally:
        conn.close()

def classify_region(lat: float, lon: float) -> str:
    """Classify coordinates into named region."""
    for name, bounds in REGION_DEFINITIONS.items():
        lat_range = bounds["lat"]
        lon_range = bounds["lon"]
        if lat_range[0] <= lat <= lat_range[1] and lon_range[0] <= lon <= lon_range[1]:
            return name
    return "Indian Ocean (General)"

def classify_basin(lat: float, lon: float) -> str:
    """Classify into major basin."""
    if 45 <= lon <= 80 and lat > -10:
        return "Arabian Sea"
    elif 80 <= lon <= 100 and lat > -5:
        return "Bay of Bengal"
    else:
        return "Indian Ocean"

def enrich_chroma():
    floats_stats = get_db_stats()
    if not floats_stats:
        print("⚠️ No float data found in PostgreSQL database.")
        return

    print(f"📦 Connecting to ChromaDB at {CHROMA_PATH}...")
    client = PersistentClient(path=CHROMA_PATH)
    
    # Reset or clear old collections if necessary, or just recreate/update
    try:
        # We can delete existing collection and recreate to prevent duplicate/stale embeddings
        print(f"🗑️ Re-creating ChromaDB collection '{COLLECTION_NAME}' to refresh embeddings...")
        try:
            client.delete_collection(name=COLLECTION_NAME)
        except Exception:
            pass
        collection = client.create_collection(name=COLLECTION_NAME)
    except Exception as e:
        print(f"⚠️ Collection re-creation issue: {e}. Retrieving existing collection...")
        collection = client.get_or_create_collection(name=COLLECTION_NAME)

    documents = []
    metadatas = []
    ids = []
    
    print(f"✨ Generating enriched documents for {len(floats_stats)} floats...")
    
    for f in floats_stats:
        wmo = str(f["wmo"])
        lat = float(f["avg_lat"]) if f["avg_lat"] is not None else 0.0
        lon = float(f["avg_lon"]) if f["avg_lon"] is not None else 0.0
        region = classify_region(lat, lon)
        basin = classify_basin(lat, lon)
        
        # Format dates
        first_p = str(f["first_profile"])[:10] if f["first_profile"] else "unknown"
        last_p = str(f["last_profile"])[:10] if f["last_profile"] else "unknown"
        
        # 1. Geographical description
        geo_desc = (
            f"ARGO float WMO {wmo} operates in the {region} within the {basin} basin. "
            f"Its average coordinate is {lat:.4f}° latitude and {lon:.4f}° longitude. "
            f"This float traverses areas near coordinates {lat:.1f}N, {lon:.1f}E and collects "
            f"hydrographic vertical profiles in this region."
        )
        meta_geo = {
            "wmo": wmo,
            "type": "geography",
            "region": region,
            "basin": basin,
            "avg_latitude": lat,
            "avg_longitude": lon,
            "total_measurements": int(f["total_measurements"])
        }
        documents.append(geo_desc)
        metadatas.append({k: v for k, v in meta_geo.items() if v is not None})
        ids.append(f"wmo_{wmo}_geo")

        # 2. Temperature and Salinity profile description
        min_t = f"{f['min_temp']:.2f}°C" if f['min_temp'] is not None else "N/A"
        max_t = f"{f['max_temp']:.2f}°C" if f['max_temp'] is not None else "N/A"
        avg_t = f"{f['avg_temp']:.2f}°C" if f['avg_temp'] is not None else "N/A"
        min_s = f"{f['min_sal']:.2f} PSU" if f['min_sal'] is not None else "N/A"
        max_s = f"{f['max_sal']:.2f} PSU" if f['max_sal'] is not None else "N/A"
        avg_s = f"{f['avg_sal']:.2f} PSU" if f['avg_sal'] is not None else "N/A"
        
        param_desc = (
            f"ARGO float WMO {wmo} collects ocean temperature and salinity profile data. "
            f"It has recorded temperatures ranging from a minimum of {min_t} to a maximum of {max_t}, "
            f"with an average temperature of {avg_t}. "
            f"Its salinity readings range from a minimum of {min_s} to a maximum of {max_s}, "
            f"with a mean salinity of {avg_s}."
        )
        meta_params = {
            "wmo": wmo,
            "type": "parameters",
            "min_temp": float(f['min_temp']) if f['min_temp'] is not None else None,
            "max_temp": float(f['max_temp']) if f['max_temp'] is not None else None,
            "avg_temp": float(f['avg_temp']) if f['avg_temp'] is not None else None,
            "min_sal": float(f['min_sal']) if f['min_sal'] is not None else None,
            "max_sal": float(f['max_sal']) if f['max_sal'] is not None else None,
            "avg_sal": float(f['avg_sal']) if f['avg_sal'] is not None else None,
        }
        documents.append(param_desc)
        metadatas.append({k: v for k, v in meta_params.items() if v is not None})
        ids.append(f"wmo_{wmo}_params")

        # 3. Operations, pressure, and temporal details
        min_p = f"{f['min_pres']:.1f} dbar" if f['min_pres'] is not None else "0"
        max_p = f"{f['max_pres']:.1f} dbar" if f['max_pres'] is not None else "2000"
        
        temporal_desc = (
            f"WMO {wmo} is an active ARGO float with {f['total_measurements']:,} total measurements. "
            f"It has been recording profiles between {first_p} and {last_p}. "
            f"It samples depths down to {max_p} pressure (dbar) from the surface ({min_p}), "
            f"capturing vertical profiles and water column stratification trends over time."
        )
        meta_temporal = {
            "wmo": wmo,
            "type": "temporal",
            "first_profile": first_p,
            "last_profile": last_p,
            "max_pressure": float(f['max_pres']) if f['max_pres'] is not None else None,
        }
        documents.append(temporal_desc)
        metadatas.append({k: v for k, v in meta_temporal.items() if v is not None})
        ids.append(f"wmo_{wmo}_temporal")

        # 4. Regional Scientific significance
        if basin == "Arabian Sea":
            sci_desc = (
                f"WMO {wmo} operates in the highly saline Arabian Sea basin. "
                f"This float is essential for monitoring monsoon dynamics (Summer and Winter monsoons), "
                f"evaporation rates, coastal upwelling, and the formation of Arabian Sea High Salinity Water (ASHSW)."
            )
        elif basin == "Bay of Bengal":
            sci_desc = (
                f"WMO {wmo} operates in the Bay of Bengal, which is characterized by heavy freshwater input "
                f"from major rivers like Ganges and Brahmaputra. The float monitors intense density stratification, "
                f"barrier layers, and sea surface freshening cycles."
            )
        else:
            sci_desc = (
                f"WMO {wmo} is located in the Indian Ocean. It monitors equatorial circulation systems, "
                f"subtropical gyre currents, heat budget, and deep ocean vertical structures."
            )
        meta_science = {
            "wmo": wmo,
            "type": "science_context",
            "basin": basin,
        }
        documents.append(sci_desc)
        metadatas.append({k: v for k, v in meta_science.items() if v is not None})
        ids.append(f"wmo_{wmo}_science")

    print(f"📥 Adding {len(documents)} enriched documents to ChromaDB collection '{COLLECTION_NAME}'...")
    collection.add(documents=documents, metadatas=metadatas, ids=ids)
    print("✅ ChromaDB enrichment completed successfully!")

if __name__ == "__main__":
    enrich_chroma()
