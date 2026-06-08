"""
OceanIQ Geocoder Service
========================
Provides place name geocoding using OpenStreetMap Nominatim API,
supporting coordinates extraction and boundary box estimation.
"""

from __future__ import annotations

import re
import urllib.parse
import logging
from typing import Dict, Any, Tuple
import requests

from app.config import NOMINATIM_USER_AGENT

logger = logging.getLogger(__name__)

# Simple in-memory cache to respect OSM usage policies
_geocode_cache: Dict[str, Dict[str, Any]] = {}


class GeocoderService:
    @classmethod
    def parse_coordinates(cls, text: str) -> Dict[str, float] | None:
        """
        Parses coordinate patterns like '15.5N, 72.3E' or '15S, 100E' or '-10.5, 90.2'
        from query text. Returns a dict of lat/lon if found.
        """
        # Coordinate pattern: Lat, Lon with N/S/E/W or positive/negative decimals
        pattern = r'(?:near\s+)?(-?\d+(?:\.\d+)?)\s*([NSns])?,?\s*(-?\d+(?:\.\d+)?)\s*([EWew])?'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                lat_val = float(match.group(1))
                lat_dir = match.group(2)
                lon_val = float(match.group(3))
                lon_dir = match.group(4)
                
                # Apply cardinal directions
                if lat_dir and lat_dir.upper() == 'S':
                    lat_val = -lat_val
                if lon_dir and lon_dir.upper() == 'W':
                    lon_val = -lon_val
                    
                return {"lat": lat_val, "lon": lon_val}
            except Exception:
                pass
        return None

    @classmethod
    def geocode_place(cls, place_name: str) -> Dict[str, Any] | None:
        """
        Geocodes a place name using the OpenStreetMap Nominatim API.
        Returns coordinate bounds and display name.
        """
        place_name_clean = place_name.strip().lower()
        if place_name_clean in _geocode_cache:
            logger.info(f"Geocoder cache hit for: {place_name_clean}")
            return _geocode_cache[place_name_clean]

        logger.info(f"Geocoding place name: '{place_name}'")
        
        # Hardcoded overrides for common ocean regions to bypass Nominatim
        overrides = {
            "arabian sea": {
                "lat": 15.0, "lon": 65.0,
                "lat_min": 0.0, "lat_max": 25.0,
                "lon_min": 45.0, "lon_max": 78.0,
                "display_name": "Arabian Sea"
            },
            "bay of bengal": {
                "lat": 15.0, "lon": 90.0,
                "lat_min": 5.0, "lat_max": 23.0,
                "lon_min": 80.0, "lon_max": 98.0,
                "display_name": "Bay of Bengal"
            },
            "indian ocean": {
                "lat": -10.0, "lon": 75.0,
                "lat_min": -40.0, "lat_max": 30.0,
                "lon_min": 30.0, "lon_max": 120.0,
                "display_name": "Indian Ocean"
            },
            "lakshadweep": {
                "lat": 10.5, "lon": 72.5,
                "lat_min": 8.0, "lat_max": 14.0,
                "lon_min": 71.0, "lon_max": 74.5,
                "display_name": "Lakshadweep Islands"
            },
            "andaman": {
                "lat": 12.0, "lon": 92.5,
                "lat_min": 6.0, "lat_max": 14.0,
                "lon_min": 91.5, "lon_max": 94.0,
                "display_name": "Andaman and Nicobar Islands"
            }
        }
        
        for key, value in overrides.items():
            if key in place_name_clean:
                _geocode_cache[place_name_clean] = value
                return value

        # Call OSM Nominatim API
        encoded_name = urllib.parse.quote(place_name)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_name}&format=json&limit=1"
        headers = {"User-Agent": NOMINATIM_USER_AGENT}
        
        try:
            res = requests.get(url, headers=headers, timeout=10)
            res.raise_for_status()
            data = res.json()
            
            if data:
                place = data[0]
                lat = float(place["lat"])
                lon = float(place["lon"])
                
                # Nominatim returns bounding box as [latMin, latMax, lonMin, lonMax]
                bbox = [float(b) for b in place.get("boundingbox", [lat-1.0, lat+1.0, lon-1.0, lon+1.0])]
                
                result = {
                    "lat": lat,
                    "lon": lon,
                    "lat_min": bbox[0],
                    "lat_max": bbox[1],
                    "lon_min": bbox[2],
                    "lon_max": bbox[3],
                    "display_name": place["display_name"]
                }
                _geocode_cache[place_name_clean] = result
                logger.info(f"Geocoding success for '{place_name}': {result}")
                return result
        except Exception as e:
            logger.error(f"Geocoding HTTP request failed for '{place_name}': {e}")
            
        return None
