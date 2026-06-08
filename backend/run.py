"""
OceanIQ Backend Launcher
=======================
Launches the restructured Flask application.
"""

from __future__ import annotations

import sys
import os

# Suppress TensorFlow oneDNN and info/warning log spam
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

# Suppress python deprecation and future warnings (e.g. from google.generativeai deprecation warning)
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)


# Fix Windows encoding for emoji/unicode stdout when redirected to logs
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

from app.server import app
from app.config import FLASK_PORT, FLASK_DEBUG
from app.services.scheduler_service import IngestionScheduler

if __name__ == "__main__":
    print("🌊 Starting OceanIQ Backend...")
    print(f"   - Port: {FLASK_PORT}")
    print(f"   - Debug Mode: {FLASK_DEBUG}")
    
    # Start periodic background data syncing from IFREMER ERDDAP
    try:
        IngestionScheduler.start()
    except Exception as e:
        print(f"⚠️ Failed to start background sync scheduler: {e}")
    
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=FLASK_DEBUG)
