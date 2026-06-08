"""
ERDDAP Data Ingestion Script for OceanIQ
==========================================
Fetches REAL ARGO float measurement data from IFREMER's public ERDDAP server
and populates the PostgreSQL database with actual temperature, salinity,
pressure, and dissolved oxygen readings.

Usage:
    python data_ingestion.py              # Fetch Indian Ocean data (default)
    python data_ingestion.py --all        # Fetch all available regions
    python data_ingestion.py --wmo 2902210  # Fetch specific float

Author: OceanIQ Team
"""

from __future__ import annotations

import os
import sys
import time
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Fix Windows encoding for emoji/unicode output
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

import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import requests
from io import StringIO

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ERDDAP_SERVER = "https://erddap.ifremer.fr/erddap"
DATASET_ID = "ArgoFloats"

# Indian Ocean bounding box (our primary focus area)
INDIAN_OCEAN_BOUNDS = {
    "lat_min": -40.0,
    "lat_max": 30.0,
    "lon_min": 30.0,
    "lon_max": 120.0,
}

# Time range — fetch last 5 years of data for a rich dataset
DEFAULT_TIME_MIN = "2019-01-01T00:00:00Z"
DEFAULT_TIME_MAX = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Variables to fetch from ERDDAP
ERDDAP_VARIABLES = [
    "platform_number",
    "cycle_number",
    "latitude",
    "longitude",
    "time",
    "pres",
    "temp",
    "psal",
]

POSTGRES_URL = os.getenv("POSTGRES_URL")

# Region classification based on coordinates
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


def classify_region(lat: float, lon: float) -> str:
    """Classify a coordinate pair into a named ocean region."""
    for region_name, bounds in REGION_DEFINITIONS.items():
        lat_range = bounds["lat"]
        lon_range = bounds["lon"]
        if lat_range[0] <= lat <= lat_range[1] and lon_range[0] <= lon <= lon_range[1]:
            return region_name
    return "Indian Ocean (General)"


def classify_basin(lat: float, lon: float) -> str:
    """Classify into major basin."""
    if 45 <= lon <= 80 and lat > -10:
        return "Arabian Sea"
    elif 80 <= lon <= 100 and lat > -5:
        return "Bay of Bengal"
    else:
        return "Indian Ocean"


def _fetch_erddap_chunk(
    variables: str,
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
    time_min: str,
    time_max: str,
    max_pressure: float = 2000.0,
    specific_wmos: list = None,
    timeout: int = 180,
) -> pd.DataFrame:
    """Fetch a single chunk of ERDDAP data. Returns a DataFrame or empty DataFrame on failure."""
    constraints = [
        f"time>={time_min}",
        f"time<={time_max}",
        f"latitude>={lat_min}",
        f"latitude<={lat_max}",
        f"longitude>={lon_min}",
        f"longitude<={lon_max}",
        f"pres<={max_pressure}",
    ]
    if specific_wmos:
        wmo_regex = "|".join(str(w) for w in specific_wmos)
        constraints.append(f'platform_number=~"({wmo_regex})"')

    constraint_str = "&".join(constraints)
    url = f"{ERDDAP_SERVER}/tabledap/{DATASET_ID}.csv?{variables}&{constraint_str}&orderBy(%22platform_number,time,pres%22)"

    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        content = response.text
        lines = content.strip().split("\n")
        if len(lines) < 3:
            return pd.DataFrame()
        # Remove the ERDDAP units row (second line)
        cleaned = "\n".join([lines[0]] + lines[2:])
        return pd.read_csv(StringIO(cleaned))
    except requests.exceptions.HTTPError as he:
        # ERDDAP returns 404 if no data matches constraints, which is normal
        if he.response is not None and he.response.status_code == 404:
            print(f"   ℹ️  No data matches constraints for this period ({time_min} to {time_max})")
        else:
            print(f"   ⚠️  Chunk failed ({time_min} to {time_max}): {he}")
        return pd.DataFrame()
    except Exception as e:
        print(f"   ⚠️  Chunk failed ({time_min} to {time_max}): {e}")
        return pd.DataFrame()


def fetch_argo_data_erddap(
    lat_min: float = None,
    lat_max: float = None,
    lon_min: float = None,
    lon_max: float = None,
    time_min: str = None,
    time_max: str = None,
    specific_wmos: list = None,
    max_pressure: float = 2000.0,
) -> pd.DataFrame:
    """
    Fetch ARGO float data from IFREMER ERDDAP server.

    Uses year-by-year chunked fetching to avoid timeouts on large datasets.
    """
    bounds = INDIAN_OCEAN_BOUNDS
    lat_min = lat_min or bounds["lat_min"]
    lat_max = lat_max or bounds["lat_max"]
    lon_min = lon_min or bounds["lon_min"]
    lon_max = lon_max or bounds["lon_max"]
    time_min = time_min or DEFAULT_TIME_MIN
    time_max = time_max or DEFAULT_TIME_MAX

    variables = ",".join(ERDDAP_VARIABLES)

    print(f"🌊 Fetching ARGO data from IFREMER ERDDAP (chunked by year)...")
    print(f"   Region: lat [{lat_min}, {lat_max}], lon [{lon_min}, {lon_max}]")
    print(f"   Time: {time_min} to {time_max}")
    if specific_wmos:
        print(f"   Floats: {specific_wmos}")

    # Parse the start/end years for chunking
    start_year = int(time_min[:4])
    end_year = int(time_max[:4])

    all_chunks = []
    total_rows = 0

    for year in range(start_year, end_year + 1):
        chunk_start = f"{year}-01-01T00:00:00Z"
        chunk_end = f"{year}-12-31T23:59:59Z" if year < end_year else time_max

        print(f"\n   📅 Fetching year {year}...")

        df_chunk = _fetch_erddap_chunk(
            variables=variables,
            lat_min=lat_min, lat_max=lat_max,
            lon_min=lon_min, lon_max=lon_max,
            time_min=chunk_start, time_max=chunk_end,
            max_pressure=max_pressure,
            specific_wmos=specific_wmos,
        )

        if not df_chunk.empty:
            n_floats = df_chunk['platform_number'].nunique()
            print(f"   ✅ {year}: {len(df_chunk):,} rows from {n_floats} floats")
            all_chunks.append(df_chunk)
            total_rows += len(df_chunk)
        else:
            print(f"   ⚠️  {year}: No data or fetch failed")

        # Small delay between requests to be polite to ERDDAP server
        time.sleep(1)

    if not all_chunks:
        print("\n❌ No data fetched from any year. Check internet connection.")
        return pd.DataFrame()

    df = pd.concat(all_chunks, ignore_index=True)
    n_floats = df['platform_number'].nunique()
    print(f"\n✅ Total fetched: {total_rows:,} measurements from {n_floats} floats across {len(all_chunks)} year(s)")
    return df


def clean_and_validate(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and validate the fetched ERDDAP data."""
    if df.empty:
        return df

    print(f"🧹 Cleaning {len(df):,} rows...")

    # Rename columns to match our PostgreSQL schema
    rename_map = {
        "platform_number": "wmo",
        "time": "profile_date",
    }
    df = df.rename(columns=rename_map)

    # Convert types
    df["wmo"] = df["wmo"].astype(str).str.strip()
    df["profile_date"] = pd.to_datetime(df["profile_date"], errors="coerce")

    # Convert numeric columns (ERDDAP sometimes returns strings)
    numeric_cols = ["latitude", "longitude", "pres", "temp", "psal"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop rows with no valid measurements at all
    measurement_cols = [c for c in ["temp", "psal", "pres"] if c in df.columns]
    df = df.dropna(subset=measurement_cols, how="all")

    # Drop rows with invalid coordinates
    df = df.dropna(subset=["latitude", "longitude"])

    # Add cycle_number if missing
    if "cycle_number" not in df.columns:
        df["cycle_number"] = None
    else:
        df["cycle_number"] = pd.to_numeric(df["cycle_number"], errors="coerce")

    # Add doxy_umolkg placeholder (ERDDAP basic dataset may not include it)
    if "doxy_umolkg" not in df.columns:
        df["doxy_umolkg"] = None

    # Generate file_name from WMO + cycle if not present
    if "file_name" not in df.columns:
        df["file_name"] = df.apply(
            lambda row: f"D{row['wmo']}_{int(row['cycle_number']):03d}.nc"
            if pd.notna(row.get("cycle_number"))
            else f"D{row['wmo']}_000.nc",
            axis=1,
        )

    # Add position_flag
    if "position_flag" not in df.columns:
        df["position_flag"] = "1"

    # Add source_file
    if "source_file" not in df.columns:
        df["source_file"] = "erddap_ifremer_import"

    # Add profile_id and profile_time placeholders
    if "profile_id" not in df.columns:
        df["profile_id"] = None
    if "profile_time" not in df.columns:
        df["profile_time"] = None
    if "level_no" not in df.columns:
        df["level_no"] = None

    # Reorder to match the existing table schema
    final_cols = [
        "cycle_number", "file_name", "latitude", "longitude",
        "position_flag", "profile_id", "profile_time", "wmo",
        "source_file", "doxy_umolkg", "level_no", "pres",
        "psal", "temp", "profile_date",
    ]
    for col in final_cols:
        if col not in df.columns:
            df[col] = None

    df = df[final_cols]

    print(f"✅ Cleaned: {len(df):,} valid measurements from {df['wmo'].nunique()} floats")

    # Print summary stats
    for col in ["temp", "psal", "pres"]:
        if col in df.columns and df[col].notna().any():
            series = df[col].dropna()
            print(f"   {col}: min={series.min():.2f}, max={series.max():.2f}, mean={series.mean():.2f}")

    return df


def create_table_if_not_exists(conn) -> None:
    """Ensure the argo_profiles table exists with the correct schema."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS argo_profiles (
                id SERIAL PRIMARY KEY,
                cycle_number TEXT,
                file_name TEXT,
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                position_flag TEXT,
                profile_id TEXT,
                profile_time TEXT,
                wmo TEXT,
                source_file TEXT,
                doxy_umolkg DOUBLE PRECISION,
                level_no TEXT,
                pres DOUBLE PRECISION,
                psal DOUBLE PRECISION,
                temp DOUBLE PRECISION,
                profile_date TIMESTAMP
            );

            -- Create indexes for fast queries
            CREATE INDEX IF NOT EXISTS idx_argo_wmo ON argo_profiles (wmo);
            CREATE INDEX IF NOT EXISTS idx_argo_date ON argo_profiles (profile_date);
            CREATE INDEX IF NOT EXISTS idx_argo_wmo_date ON argo_profiles (wmo, profile_date);
            CREATE INDEX IF NOT EXISTS idx_argo_coords ON argo_profiles (latitude, longitude);
        """)
        conn.commit()
        print("✅ Table 'argo_profiles' verified with indexes")


def insert_data(conn, df: pd.DataFrame, batch_size: int = 5000) -> int:
    """Insert data into PostgreSQL in batches."""
    if df.empty:
        print("⚠️  No data to insert.")
        return 0

    # Clear existing data from the same source and WMOs to avoid duplicates
    wmos_to_clear = list(df['wmo'].unique())
    wmo_placeholder = ', '.join(['%s'] * len(wmos_to_clear))
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT COUNT(*) FROM argo_profiles WHERE source_file = 'erddap_ifremer_import' AND wmo IN ({wmo_placeholder})",
            wmos_to_clear
        )
        existing = cur.fetchone()[0]
        if existing > 0:
            print(f"🗑️  Clearing {existing:,} existing ERDDAP-imported rows for WMOs {wmos_to_clear}...")
            cur.execute(
                f"DELETE FROM argo_profiles WHERE source_file = 'erddap_ifremer_import' AND wmo IN ({wmo_placeholder})",
                wmos_to_clear
            )
            conn.commit()

    columns = [
        "cycle_number", "file_name", "latitude", "longitude",
        "position_flag", "profile_id", "profile_time", "wmo",
        "source_file", "doxy_umolkg", "level_no", "pres",
        "psal", "temp", "profile_date",
    ]

    # Prepare tuples for bulk insert
    records = []
    for _, row in df.iterrows():
        record = []
        for col in columns:
            val = row.get(col)
            if pd.isna(val) if isinstance(val, (float, np.floating)) else val is None:
                record.append(None)
            elif col == "profile_date" and isinstance(val, pd.Timestamp):
                record.append(val.to_pydatetime())
            else:
                record.append(str(val) if col in ["cycle_number", "file_name", "position_flag", "profile_id", "profile_time", "wmo", "source_file", "level_no"] else val)
        records.append(tuple(record))

    insert_sql = f"""
        INSERT INTO argo_profiles ({', '.join(columns)})
        VALUES %s
    """

    total_inserted = 0
    with conn.cursor() as cur:
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            execute_values(cur, insert_sql, batch, page_size=batch_size)
            total_inserted += len(batch)
            print(f"   📥 Inserted batch {i // batch_size + 1}: {total_inserted:,}/{len(records):,} rows")

    conn.commit()
    print(f"✅ Total inserted: {total_inserted:,} rows into PostgreSQL")
    return total_inserted


def verify_data(conn) -> None:
    """Print verification summary of the database."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM argo_profiles")
        total = cur.fetchone()[0]

        cur.execute("SELECT COUNT(DISTINCT wmo) FROM argo_profiles")
        floats = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM argo_profiles WHERE temp IS NOT NULL")
        with_temp = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM argo_profiles WHERE psal IS NOT NULL")
        with_sal = cur.fetchone()[0]

        cur.execute("SELECT MIN(profile_date), MAX(profile_date) FROM argo_profiles WHERE profile_date IS NOT NULL")
        date_range = cur.fetchone()

        cur.execute("""
            SELECT wmo, COUNT(*) as cnt,
                   AVG(temp::DOUBLE PRECISION) as avg_temp,
                   AVG(psal::DOUBLE PRECISION) as avg_sal
            FROM argo_profiles
            WHERE temp IS NOT NULL
            GROUP BY wmo
            ORDER BY cnt DESC
            LIMIT 10
        """)
        top_floats = cur.fetchall()

    print("\n" + "=" * 60)
    print("📊 DATABASE VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"   Total rows:          {total:,}")
    print(f"   Unique floats:       {floats}")
    print(f"   Rows with temp:      {with_temp:,}")
    print(f"   Rows with salinity:  {with_sal:,}")
    if date_range[0]:
        print(f"   Date range:          {date_range[0]} → {date_range[1]}")

    if top_floats:
        print(f"\n   Top {len(top_floats)} floats by profile count:")
        for wmo, cnt, avg_t, avg_s in top_floats:
            temp_str = f"{avg_t:.1f}°C" if avg_t else "N/A"
            sal_str = f"{avg_s:.1f} PSU" if avg_s else "N/A"
            print(f"     WMO {wmo}: {cnt:,} profiles, avg temp {temp_str}, avg sal {sal_str}")

    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Ingest ARGO float data from ERDDAP into PostgreSQL")
    parser.add_argument("--wmo", nargs="+", help="Specific WMO float IDs to fetch")
    parser.add_argument("--time-min", default=DEFAULT_TIME_MIN, help="Start time (ISO format)")
    parser.add_argument("--time-max", default=DEFAULT_TIME_MAX, help="End time (ISO format)")
    parser.add_argument("--verify-only", action="store_true", help="Only verify existing data, don't fetch")
    args = parser.parse_args()

    if not POSTGRES_URL:
        print("❌ POSTGRES_URL not found in .env file!")
        sys.exit(1)

    print("🌊 OceanIQ ERDDAP Data Ingestion")
    print("=" * 50)

    # Connect to PostgreSQL
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        print("✅ Connected to PostgreSQL (Neon)")
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        sys.exit(1)

    try:
        create_table_if_not_exists(conn)

        if args.verify_only:
            verify_data(conn)
            return

        # Fetch data from ERDDAP
        df = fetch_argo_data_erddap(
            time_min=args.time_min,
            time_max=args.time_max,
            specific_wmos=args.wmo,
        )

        if df.empty:
            print("⚠️  No data fetched. Check your constraints or internet connection.")
            return

        # Clean and validate
        df = clean_and_validate(df)

        if df.empty:
            print("⚠️  All data was filtered out during cleaning.")
            return

        # Insert into PostgreSQL
        insert_data(conn, df)

        # Verify
        verify_data(conn)

        print("\n🎉 Data ingestion complete! Your PostgreSQL now has REAL ARGO data.")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
