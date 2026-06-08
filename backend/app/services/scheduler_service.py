"""
OceanIQ Background Ingestion Scheduler Service
=============================================
Periodically syncs new vertical profiles from IFREMER's ERDDAP server
into our PostgreSQL database in the background. Runs incrementally
to minimize network transfer and respect rate limits.
"""

from __future__ import annotations

import time
import threading
import logging
from datetime import datetime, timezone
import pandas as pd
import psycopg2

from app.config import POSTGRES_URL
from data_ingestion import fetch_argo_data_erddap, clean_and_validate, insert_data

logger = logging.getLogger(__name__)


class IngestionScheduler:
    _thread: threading.Thread | None = None
    _stop_event = threading.Event()
    
    # Sync interval default is 7 days (in seconds)
    INTERVAL_SECONDS = 7 * 24 * 60 * 60 

    @classmethod
    def start(cls, interval_seconds: int = None) -> None:
        """Starts the background scheduler thread if not already running."""
        if interval_seconds:
            cls.INTERVAL_SECONDS = interval_seconds
            
        if cls._thread and cls._thread.is_alive():
            logger.info("Ingestion scheduler is already running.")
            return

        cls._stop_event.clear()
        cls._thread = threading.Thread(
            target=cls._run_scheduler, 
            name="OceanIQ-IngestionScheduler-Thread",
            daemon=True
        )
        cls._thread.start()
        logger.info(f"Started background Ingestion Scheduler (Interval: {cls.INTERVAL_SECONDS / 3600:.1f} hours).")

    @classmethod
    def stop(cls) -> None:
        """Stops the background scheduler thread."""
        cls._stop_event.set()
        if cls._thread:
            cls._thread.join(timeout=5)
            logger.info("Stopped background Ingestion Scheduler.")

    @classmethod
    def _run_scheduler(cls) -> None:
        """Main scheduler loop running in a daemon thread."""
        # Wait 10 seconds after app startup before running first sync
        time.sleep(10)
        
        while not cls._stop_event.is_set():
            logger.info("Triggering background ARGO data sync with IFREMER ERDDAP...")
            try:
                cls.sync_latest_data()
            except Exception as e:
                logger.error(f"Error during background data sync: {e}")
                
            # Sleep in small increments to allow responsive thread stopping
            slept = 0
            while slept < cls.INTERVAL_SECONDS:
                if cls._stop_event.is_set():
                    break
                time.sleep(5)
                slept += 5

    @classmethod
    def sync_latest_data(cls) -> None:
        """Finds the latest dates for each WMO float in PostgreSQL, fetches deltas from ERDDAP, and saves them."""
        if not POSTGRES_URL:
            logger.error("POSTGRES_URL is missing. Sync aborted.")
            return

        # 1. Connect and query last profile date for each float
        wmo_dates = {}
        try:
            with psycopg2.connect(POSTGRES_URL) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT wmo, MAX(profile_date) 
                        FROM argo_profiles 
                        WHERE profile_date IS NOT NULL
                        GROUP BY wmo
                    """)
                    for wmo, max_date in cur.fetchall():
                        wmo_dates[wmo] = max_date
        except Exception as e:
            logger.error(f"Failed to query last profile dates from Postgres: {e}")
            return

        if not wmo_dates:
            logger.warning("No floats found in PostgreSQL to sync.")
            return

        logger.info(f"Syncing data for {len(wmo_dates)} floats. Last updates: {wmo_dates}")

        # 2. Fetch incrementally for each float since its last update
        total_synced_rows = 0
        
        # Connect to PostgreSQL for writes
        try:
            with psycopg2.connect(POSTGRES_URL) as conn:
                for wmo, last_date in wmo_dates.items():
                    # Check if stop event was triggered mid-sync
                    if cls._stop_event.is_set():
                        break
                        
                    # Convert last_date to pandas Timestamp if it's a string, to avoid addition errors
                    try:
                        last_date_ts = pd.to_datetime(last_date)
                    except Exception:
                        last_date_ts = last_date
                        
                    # Format last_date in ISO format for ERDDAP constraint (adding 1 second to avoid fetching last profile again)
                    time_min_dt = last_date_ts + pd.Timedelta(seconds=1)
                    time_min = time_min_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                    time_max = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                    
                    logger.info(f"Fetching delta for float {wmo} since {time_min}...")
                    
                    try:
                        df = fetch_argo_data_erddap(
                            specific_wmos=[wmo],
                            time_min=time_min,
                            time_max=time_max
                        )
                        
                        if df.empty:
                            logger.info(f"Float {wmo} is already up to date.")
                            continue
                            
                        # Clean and validate
                        df_clean = clean_and_validate(df)
                        if df_clean.empty:
                            continue
                            
                        # Insert into PostgreSQL
                        inserted = insert_data(conn, df_clean)
                        total_synced_rows += inserted
                        logger.info(f"Successfully synced {inserted} new profiles for WMO {wmo}.")
                        
                    except Exception as fe:
                        logger.error(f"Failed to sync WMO {wmo} from ERDDAP: {fe}")
                        
        except Exception as e:
            logger.error(f"PostgreSQL connection issue during sync loop: {e}")
            
        logger.info(f"Sync complete. Ingested {total_synced_rows} new records from IFREMER in the background.")
