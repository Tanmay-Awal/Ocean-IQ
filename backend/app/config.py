"""
OceanIQ Configuration
=====================
Centralized configuration loaded from environment variables.
All secrets and tunable parameters live here.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
POSTGRES_URL = os.getenv(
    "POSTGRES_URL",
    "postgresql://neondb_owner:npg_IJSRXYiFGc75@ep-sparkling-butterfly-adch5qkf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

# ---------------------------------------------------------------------------
# LLM Providers
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Primary LLM provider: "gemini" or "groq"
LLM_PRIMARY = os.getenv("LLM_PRIMARY", "gemini")
LLM_FALLBACK = os.getenv("LLM_FALLBACK", "groq")

# ---------------------------------------------------------------------------
# ChromaDB / Embeddings
# ---------------------------------------------------------------------------
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "argo_profiles_metadata")

# ---------------------------------------------------------------------------
# ERDDAP Data Source
# ---------------------------------------------------------------------------
ERDDAP_SERVER = os.getenv("ERDDAP_SERVER", "https://erddap.ifremer.fr/erddap")
ERDDAP_DATASET_ID = os.getenv("ERDDAP_DATASET_ID", "ArgoFloats")

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

# Chat memory limit
CHAT_MEMORY_LIMIT = int(os.getenv("CHAT_MEMORY_LIMIT", "20"))

# Graph output directory
GRAPHS_DIR = os.getenv("GRAPHS_DIR", "./graphs")

# LLM History
HISTORY_FILE = os.getenv("HISTORY_FILE", "llm_history.json")
MAX_HISTORY = int(os.getenv("MAX_HISTORY", "20"))

# ---------------------------------------------------------------------------
# Geocoding
# ---------------------------------------------------------------------------
NOMINATIM_USER_AGENT = os.getenv("NOMINATIM_USER_AGENT", "oceaniq-dashboard")
GEOCODE_CACHE_SIZE = int(os.getenv("GEOCODE_CACHE_SIZE", "128"))

# ---------------------------------------------------------------------------
# Region Definitions (for classifying float locations)
# ---------------------------------------------------------------------------
REGION_DEFINITIONS = {
    "Northern Arabian Sea": {"lat": (15, 30), "lon": (55, 75)},
    "Central Arabian Sea": {"lat": (5, 15), "lon": (55, 75)},
    "Southern Arabian Sea": {"lat": (-5, 5), "lon": (45, 75)},
    "Northern Bay of Bengal": {"lat": (15, 25), "lon": (80, 95)},
    "Central Bay of Bengal": {"lat": (5, 15), "lon": (80, 95)},
    "Southern Bay of Bengal": {"lat": (-5, 5), "lon": (80, 95)},
    "Equatorial Indian Ocean": {"lat": (-10, 10), "lon": (40, 100)},
    "Southern Indian Ocean": {"lat": (-40, -10), "lon": (30, 120)},
    "Andaman Sea": {"lat": (5, 20), "lon": (92, 100)},
    "Lakshadweep Sea": {"lat": (8, 15), "lon": (70, 78)},
}

# Indian Ocean bounding box
INDIAN_OCEAN_BOUNDS = {
    "lat_min": -40.0,
    "lat_max": 30.0,
    "lon_min": 30.0,
    "lon_max": 120.0,
}

# ---------------------------------------------------------------------------
# Variable Catalog (for query parsing)
# ---------------------------------------------------------------------------
VARIABLE_ALIASES = {
    "temp": "temp",
    "temperature": "temp",
    "heat": "temp",
    "warm": "temp",
    "cold": "temp",
    "hot": "temp",
    "salinity": "psal",
    "psal": "psal",
    "salt": "psal",
    "fresh": "psal",
    "freshwater": "psal",
    "oxygen": "doxy_umolkg",
    "dissolved oxygen": "doxy_umolkg",
    "doxy": "doxy_umolkg",
    "pressure": "pres",
    "depth": "pres",
    "pres": "pres",
}

AGGREGATION_KEYWORDS = {
    "average": "mean",
    "avg": "mean",
    "mean": "mean",
    "median": "median",
    "max": "max",
    "maximum": "max",
    "highest": "max",
    "hottest": "max",
    "warmest": "max",
    "saltiest": "max",
    "min": "min",
    "minimum": "min",
    "lowest": "min",
    "coldest": "min",
    "coolest": "min",
    "freshest": "min",
    "count": "count",
    "total": "count",
    "number": "count",
    "std": "std",
    "deviation": "std",
    "variability": "std",
    "range": "range",
}
