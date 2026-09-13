import sys
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

import json
import time
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import os
from functools import wraps
from flask import after_this_request
import pandas as pd
from functools import wraps
from flask import after_this_request

# Import all systems
from argo_system import EnhancedHybridArgoSystem
from gemini import GeminiThinkingSystem
from graphs import ArgoGraphGenerator
from app.services.intelligence_engine import IntelligenceEngine

# Initialize the Flask app
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Define the directory for graph images
GRAPHS_DIR = "graphs"

# Initialize all data systems once when the server starts
try:
    standard_system = EnhancedHybridArgoSystem()
    thinking_system = GeminiThinkingSystem(standard_system)
    graph_generator = ArgoGraphGenerator()
    is_server_ready = True
except Exception as e:
    print(f"Failed to initialize one or more systems: {e}", file=sys.stderr)
    standard_system = None
    thinking_system = None
    is_server_ready = False

# New route to serve graph images
# Note: The deletion logic has been completely removed from this route.
@app.route(f'/{GRAPHS_DIR}/<path:filename>')
def serve_graph(filename):
    try:
        return send_from_directory(GRAPHS_DIR, filename)
    except FileNotFoundError:
        return jsonify({'error': 'The requested ocean profile graph could not be found.'}), 404

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    if not is_server_ready:
        return jsonify({'error': 'The OceanIQ analytics server is still starting up. Please wait a moment and try again.'}), 500

    data = request.get_json()
    user_query = data.get('query')
    is_thinking_mode = data.get('isThinkingMode', False)
    chat_memory = data.get('chatMemory', [])

    if not user_query:
        return jsonify({'error': 'Please provide an oceanographic query or question to analyze.'}), 400

    def generate():
        try:
            for chunk in IntelligenceEngine.process_query_stream(user_query, chat_memory, is_thinking_mode):
                yield chunk
        except Exception as e:
            print(f"Error in stream: {e}", file=sys.stderr)
            import json
            yield f"event: error\ndata: {json.dumps('Aqua AI encountered an issue processing this query. Please try rephrasing or retry in a moment.')}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    try:
        from app.services.data_service import DataService
        metadata = DataService.get_floats_metadata()
        
        if not metadata:
            return jsonify({'stats': {}, 'coverage': [], 'floats': []})
            
        total_floats = len(metadata)
        total_profiles = sum(item.get("measurements_count", 0) for item in metadata)
        
        valid_temps = [item.get("avg_temp") for item in metadata if item.get("avg_temp") is not None]
        avg_temp = sum(valid_temps) / len(valid_temps) if valid_temps else 15.0
        
        # Calculate regional coverage
        regions = {}
        for item in metadata:
            r = item.get("region", "Unknown")
            regions[r] = regions.get(r, 0) + 1
            
        coverage_data = [{"region": k, "coverage": v} for k, v in regions.items()]
        
        return jsonify({
            'stats': {
                'totalFloats': total_floats,
                'cachedProfiles': total_profiles,
                'avgTemperature': round(avg_temp, 1),
                'dataCoverage': 100 # Default until coverage metric is defined
            },
            'coverage': coverage_data,
            'floats': metadata
        })
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}", file=sys.stderr)
        return jsonify({'error': 'Unable to retrieve dashboard telemetry statistics at this time. Please try again shortly.'}), 500

@app.route("/api/floats", methods=["GET"])
def get_floats():
    """Returns metadata for all unique floats in the system."""
    try:
        from app.services.data_service import DataService
        metadata = DataService.get_floats_metadata()
        return jsonify({"floats": metadata})
    except Exception as e:
        print(f"Error in /api/floats: {e}", file=sys.stderr)
        return jsonify({"error": "Unable to load float array data at this time. Please try again shortly."}), 500

@app.route("/api/floats/<wmo>/stats", methods=["GET"])
def get_float_stats(wmo):
    """Computes advanced vertical profile analysis metrics for a float."""
    try:
        from app.services.data_service import DataService
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
        print(f"Error computing float stats: {e}", file=sys.stderr)
        return jsonify({"error": f"Unable to compute profile metrics for float {wmo}. Please try again shortly."}), 500

@app.route("/api/dashboard/profile-curves", methods=["GET"])
def get_profile_curves():
    """Returns dynamic averaged temperature profiles for two floats."""
    try:
        from app.services.data_service import DataService
        
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
        print(f"Error computing profile curves: {e}", file=sys.stderr)
        return jsonify({"error": "Unable to calculate vertical profile curves at this time. Please try again shortly."}), 500

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
        from app.services.data_service import DataService
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
        print(f"Error in /api/data: {e}", file=sys.stderr)
        return jsonify({"error": "Unable to retrieve telemetry soundings preview. Please try again shortly."}), 500

@app.route("/api/export", methods=["POST"])
def export_csv():
    """Exports filtered ARGO data as CSV."""
    try:
        from app.services.data_service import DataService
        body = request.get_json() or {}
        wmo_ids = body.get("wmo_ids", [])
        filters = body.get("filters", {})
        
        if not wmo_ids:
            metadata = DataService.get_floats_metadata()
            wmo_ids = [f["wmo"] for f in metadata]
            
        data_res = DataService.get_detailed_data(wmo_ids, filters=filters, limit=50000)
        df = pd.DataFrame(data_res.get("data", []))
        
        if df.empty:
            return jsonify({"error": "No matching ocean profile records found to export for the selected criteria."}), 404
            
        csv_data = df.to_csv(index=False)
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=argo_data_export.csv"}
        )
    except Exception as e:
        print(f"Error exporting CSV: {e}", file=sys.stderr)
        return jsonify({"error": "An issue occurred while generating the CSV export file. Please try again."}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    if not is_server_ready:
        return jsonify({'error': 'The OceanIQ analytics server is still starting up. Please wait a moment and try again.'}), 500

    try:
        data = request.get_json()
        user_query = data.get('query')
        is_thinking_mode = data.get('isThinkingMode', False)
        chat_memory = data.get('chatMemory', [])

        if not user_query:
            return jsonify({'error': 'Please provide an oceanographic query or question to analyze.'}), 400

        graph_keywords = ['plot', 'graph', 'chart']
        is_graph_request = any(keyword in user_query.lower() for keyword in graph_keywords)
        
        if is_graph_request:
            raw_data = standard_system.get_raw_data_for_graph(user_query)
            
            if raw_data is None:
                return jsonify({'message': "Insufficient profile soundings found to plot a depth profile for that query. Try specifying an active WMO ID (e.g. 2902217)."})
            
            # Ensure the graphs directory exists
            if not os.path.exists(GRAPHS_DIR):
                os.makedirs(GRAPHS_DIR)
            
            graph_path = graph_generator.generate_graph_from_data(user_query, raw_data)
            
            if graph_path:
                # Return the relative URL to the graph image
                # The file is not deleted here or in the serving route.
                relative_graph_url = f'/{GRAPHS_DIR}/{os.path.basename(graph_path)}'
                return jsonify({'graph_path': relative_graph_url})
            else:
                return jsonify({'message': "Unable to generate the requested physical profile graph. Please refine your query parameters."})

        if is_thinking_mode:
            final_answer = thinking_system.query_system_thinking_mode(user_query, chat_memory)
        else:
            final_answer = standard_system.query_system(user_query, chat_memory)

        return jsonify({'message': final_answer})

    except Exception as e:
        print(f"An error occurred during chat processing: {e}", file=sys.stderr)
        return jsonify({'error': 'Aqua AI was unable to complete the analysis. Please try rephrasing your research query.'}), 500

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)