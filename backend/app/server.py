"""
OceanIQ Backend Server
======================
Flask REST API for OceanIQ. Integrates our services:
1. Intelligence Engine (conversational pipeline)
2. Geocoding and Data Services
"""

from __future__ import annotations

import logging
import os
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

from app.config import FLASK_PORT, FLASK_DEBUG, GRAPHS_DIR
from app.services.intelligence_engine import IntelligenceEngine
from app.services.data_service import DataService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all origins, allowing typical React development servers
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/graphs/*": {"origins": "*"}})

# Ensure graphs directory exists
os.makedirs(os.path.abspath(GRAPHS_DIR), exist_ok=True)


@app.route("/graphs/<path:filename>")
def serve_graph(filename):
    """Serves generated static graphs."""
    try:
        return send_from_directory(os.path.abspath(GRAPHS_DIR), filename)
    except FileNotFoundError:
        return jsonify({"error": "Graph not found"}), 404


@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple API health check."""
    return jsonify({"status": "healthy", "service": "oceaniq-backend"})


@app.route("/api/floats", methods=["GET"])
def get_floats():
    """Returns metadata for all unique floats in the system."""
    try:
        metadata = DataService.get_floats_metadata()
        return jsonify({"floats": metadata})
    except Exception as e:
        logger.error(f"Error in /api/floats: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    """Main conversational API endpoint."""
    try:
        body = request.get_json() or {}
        query = body.get("query")
        thinking_mode = body.get("isThinkingMode", False)
        chat_memory = body.get("chatMemory", [])

        if not query:
            return jsonify({"error": "No query provided."}), 400

        # Run the query through our intelligent orchestrator pipeline
        result = IntelligenceEngine.process_query(
            query=query,
            chat_history=chat_memory,
            thinking_mode=thinking_mode
        )

        # Build response compatible with frontend
        response_data = {
            "message": result["message"],
            "graph_path": result.get("graph_path"),
            "graph_json": result.get("graph_json"),
            "attribution": result["attribution"]
        }

        return jsonify(response_data)

    except Exception as e:
        logger.exception("Error during chat processing:")
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat/stream", methods=["POST"])
def chat_stream():
    """Streaming conversational endpoint using Server-Sent Events (SSE)."""
    try:
        body = request.get_json() or {}
        query = body.get("query")
        thinking_mode = body.get("isThinkingMode", False)
        chat_memory = body.get("chatMemory", [])

        if not query:
            return jsonify({"error": "No query provided."}), 400

        # Return the event stream response
        return Response(
            IntelligenceEngine.process_query_stream(
                query=query,
                chat_history=chat_memory,
                thinking_mode=thinking_mode
            ),
            mimetype="text/event-stream"
        )
    except Exception as e:
        logger.exception("Error during chat streaming setup:")
        return jsonify({"error": str(e)}), 500


@app.route("/api/floats/<wmo>/stats", methods=["GET"])
def get_float_stats(wmo):
    """Computes advanced vertical profile analysis metrics for a float."""
    try:
        from app.services.analysis_service import AnalysisService
        
        # Fetch total raw rows from db regardless of temperature filters
        with DataService.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM argo_profiles WHERE wmo = '{wmo}'")
                total_raw_profiles = cur.fetchone()[0]

        data_res = DataService.get_detailed_data([wmo], limit=5000)
        df = pd.DataFrame(data_res.get("data", []))
            
        mld = AnalysisService.compute_mixed_layer_depth(df) if not df.empty else {"error": "no data"}
        therm = AnalysisService.compute_thermocline_depth(df) if not df.empty else {"error": "no data"}
        
        temps = df["temperature"].dropna() if not df.empty and "temperature" in df.columns else pd.Series()
        sals = df["salinity"].dropna() if not df.empty and "salinity" in df.columns else pd.Series()
        
        stats = {
            "wmo": wmo,
            "measurements_count": total_raw_profiles,
            "temp_min": float(temps.min()) if not temps.empty else None,
            "temp_max": float(temps.max()) if not temps.empty else None,
            "temp_avg": float(temps.mean()) if not temps.empty else None,
            "sal_min": float(sals.min()) if not sals.empty else None,
            "sal_max": float(sals.max()) if not sals.empty else None,
            "sal_avg": float(sals.mean()) if not sals.empty else None,
            "mld": mld if not (isinstance(mld, dict) and "error" in mld) else None,
            "thermocline": therm if not (isinstance(therm, dict) and "error" in therm) else None
        }
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error computing float stats: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/profile-curves", methods=["GET"])
def get_profile_curves():
    """Returns dynamic averaged temperature profiles for two floats."""
    try:
        # Select two floats with good temperature profiles
        floats = ["1902677", "2902217"]
        
        data_res = DataService.get_detailed_data(floats, limit=2000)
        df = pd.DataFrame(data_res.get("data", []))
        
        if df.empty or "temperature" not in df.columns or "pressure" not in df.columns:
            return jsonify({"curves": [], "wmo1": None, "wmo2": None})
            
        df = df.dropna(subset=["temperature", "pressure", "wmo"])
        # Bin depth by 50m increments
        df["depth_bin"] = (df["pressure"] // 50) * 50
        
        # Group by depth_bin and wmo to get average temperature
        grouped = df.groupby(["depth_bin", "wmo"])["temperature"].mean().reset_index()
        
        # Pivot table to get wmos as columns
        pivot = grouped.pivot(index="depth_bin", columns="wmo", values="temperature").reset_index()
        
        results = []
        wmos = list(pivot.columns)
        wmos.remove("depth_bin")
        wmo1 = wmos[0] if len(wmos) > 0 else None
        wmo2 = wmos[1] if len(wmos) > 1 else None
        
        for _, row in pivot.iterrows():
            item = {"depth": int(row["depth_bin"])}
            if wmo1 and pd.notna(row[wmo1]):
                item["temp1"] = float(row[wmo1])
            if wmo2 and pd.notna(row[wmo2]):
                item["temp2"] = float(row[wmo2])
            results.append(item)
            
        # Sort by depth
        results = sorted(results, key=lambda x: x["depth"])
        
        return jsonify({
            "curves": results,
            "wmo1": wmo1,
            "wmo2": wmo2
        })
    except Exception as e:
        logger.error(f"Error computing profile curves: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/suggestions", methods=["GET"])
def get_suggestions():
    """Returns a list of curated suggested queries for researchers."""
    suggestions = [
        {"category": "Data Queries", "query": "Show me the average temperature in the Northern Arabian Sea"},
        {"category": "Visualizations", "query": "Plot a depth profile for float 2902217"},
        {"category": "Advanced Analytics", "query": "Calculate the Mixed Layer Depth for WMO 2902210"},
        {"category": "Advanced Analytics", "query": "Find the Thermocline depth for float 1902677"},
        {"category": "Comparisons", "query": "Compare salinity between WMO 2902210 and 2902217"},
        {"category": "Trends", "query": "Show temperature trends in the Southern Indian Ocean"},
    ]
    return jsonify({"suggestions": suggestions})


@app.route("/api/data", methods=["POST"])
def get_data():
    """Returns filtered ARGO data as JSON for previewing."""
    try:
        body = request.get_json() or {}
        wmo_ids = body.get("wmo_ids", [])
        filters = body.get("filters", {})
        limit = body.get("limit", 100)
        
        if not wmo_ids:
            metadata = DataService.get_floats_metadata()
            wmo_ids = [f["wmo"] for f in metadata]
            
        data_res = DataService.get_detailed_data(wmo_ids, filters=filters, limit=limit)
        return jsonify(data_res)
    except Exception as e:
        logger.error(f"Error in /api/data: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/export", methods=["POST"])
def export_csv():
    """Exports filtered ARGO data as CSV."""
    try:
        body = request.get_json() or {}
        wmo_ids = body.get("wmo_ids", [])
        filters = body.get("filters", {})
        
        if not wmo_ids:
            metadata = DataService.get_floats_metadata()
            wmo_ids = [f["wmo"] for f in metadata]
            
        data_res = DataService.get_detailed_data(wmo_ids, filters=filters, limit=50000)
        df = pd.DataFrame(data_res.get("data", []))
        
        if df.empty:
            return jsonify({"error": "No data found to export."}), 404
            
        csv_data = df.to_csv(index=False)
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=argo_data_export.csv"}
        )
    except Exception as e:
        logger.error(f"Error exporting CSV: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logger.info(f"Starting OceanIQ server on port {FLASK_PORT}...")
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=FLASK_DEBUG)
