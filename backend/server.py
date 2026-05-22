import sys
import json
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from functools import wraps
from flask import after_this_request

# Import all systems
from argo_system import EnhancedHybridArgoSystem
from gemini import GeminiThinkingSystem
from graphs import ArgoGraphGenerator

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
        return jsonify({'error': 'Graph not found'}), 404

@app.route('/api/chat', methods=['POST'])
def chat():
    if not is_server_ready:
        return jsonify({'error': 'Server initialization failed'}), 500

    try:
        data = request.get_json()
        user_query = data.get('query')
        is_thinking_mode = data.get('isThinkingMode', False)
        chat_memory = data.get('chatMemory', [])

        if not user_query:
            return jsonify({'error': 'No query provided in the request'}), 400

        graph_keywords = ['plot', 'graph', 'chart']
        is_graph_request = any(keyword in user_query.lower() for keyword in graph_keywords)
        
        if is_graph_request:
            raw_data = standard_system.get_raw_data_for_graph(user_query)
            
            if raw_data is None:
                return jsonify({'message': "I couldn't find enough data to generate a graph for that query."})
            
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
                return jsonify({'message': "I was unable to generate a graph for that data."})

        if is_thinking_mode:
            final_answer = thinking_system.query_system_thinking_mode(user_query, chat_memory)
        else:
            final_answer = standard_system.query_system(user_query)

        return jsonify({'message': final_answer})

    except Exception as e:
        print(f"An error occurred during chat processing: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)