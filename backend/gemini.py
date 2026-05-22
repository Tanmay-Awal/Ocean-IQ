
import pandas as pd
import numpy as np
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import os
import google.generativeai as genai
import requests
import re
from datetime import datetime, timedelta
import json
import matplotlib.pyplot as plt

# --- NEW: Gemini API and History Configuration ---
GEMINI_MODEL = "gemini-1.5-flash"
HISTORY_FILE = "ollama_history.json"
MAX_HISTORY = 10

try:
    genai.configure(api_key="AIzaSyC5ko1NcnysVBs25PoUaf3XrhUfrY-ZK-8")
except Exception as e:
    print(f"Error configuring Gemini API: {e}. Please ensure GOOGLE_API_KEY environment variable is set.")

class GeminiThinkingSystem:
    def __init__(self, argo_system_instance):
        self.console = Console()
        self.argo_system = argo_system_instance
        self.console.print(Panel.fit("[bold magenta]🧠 Gemini Thinking System Ready[/bold magenta]", border_style="magenta"))

    def ask_gemini_enhanced(self, prompt):
        """Send a prompt to the Gemini LLM for analysis."""
        system_prompt = """You are Aqua, an expert AI oceanographer and data analyst. Your goal is to provide a concise, insightful summary based on provided historical data.

*CRITICAL INSTRUCTIONS:*
1.  *Analyze the provided data:* A list of previous questions and answers is provided.
2.  *Identify patterns and trends:* Look for repeated topics, variations in response length, or recurring types of questions.
3.  *Synthesize a summary:* Write a 2-3 sentence summary of the "Ollama history" and the key insights you've gleaned.
4.  *End with a forward-looking statement:* Conclude with a suggestion for the next logical step based on your analysis."""
        try:
            model = genai.GenerativeModel(model_name=GEMINI_MODEL, system_instruction=system_prompt)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"I'm having trouble connecting to my analysis model right now. Error: {e}"

    def ask_gemini_thinking_mode(self, user_query, chat_memory, detailed_data=None):
        """Send a prompt to Gemini in thinking mode with deep analysis and conversation history."""
        system_prompt = """You are Aqua, an expert AI oceanographer with deep analytical capabilities. You are in THINKING MODE, which means you should:

*CRITICAL THINKING MODE INSTRUCTIONS:*
1. *Deep Analysis:* Provide comprehensive, detailed analysis that goes beyond surface-level responses
2. *Context Integration:* Use the conversation history to provide contextually relevant insights
3. *Pattern Recognition:* Identify patterns, trends, and connections across the conversation history
4. *Scientific Rigor:* Apply oceanographic principles and scientific methodology to your analysis
5. *Forward Thinking:* Consider implications, predictions, and future research directions
6. *Memory Utilization:* Reference previous conversations when relevant to provide deeper insights

*RESPONSE FORMAT:*
- Start with a brief summary of what you're analyzing
- Provide detailed analysis with scientific reasoning
- Reference conversation history when relevant
- End with insights and recommendations for further exploration"""
        
        memory_context = ""
        if chat_memory and len(chat_memory) > 0:
            memory_context = "\n\nCONVERSATION HISTORY FOR CONTEXT:\n"
            for i, memory in enumerate(chat_memory[-10:], 1):
                memory_context += f"Previous Question {i}: {memory['question']}\n"
                memory_context += f"Previous Answer {i}: {memory['answer']}\n\n"
        
        data_context = ""
        if detailed_data and 'data' in detailed_data:
            df = pd.DataFrame(detailed_data['data'])
            data_context = f"\n\nCURRENT DATA ANALYSIS:\n"
            data_context += f"Found {len(df)} measurements from {df['wmo'].nunique()} floats.\n"
            
            for col in ['temperature', 'pressure', 'salinity', 'dissolved_oxygen']:
                if col in df.columns and not df[col].isna().all():
                    series = df[col].dropna()
                    if len(series) > 0:
                        data_context += f"{col.title()}: Range {series.min():.2f} to {series.max():.2f}, Mean {series.mean():.2f}\n"
        
        full_prompt = f"{system_prompt}\n\nCURRENT USER QUERY: {user_query}{memory_context}{data_context}\n\nPlease provide a comprehensive analysis in thinking mode."
        
        try:
            model = genai.GenerativeModel(model_name=GEMINI_MODEL, system_instruction=system_prompt)
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            return f"I'm having trouble connecting to my thinking analysis model right now. Error: {e}"
            
    def query_system_thinking_mode(self, user_query, chat_memory):
        """Main query pipeline for thinking mode with deep analysis."""
        self.console = Console()
        self.console.print(Panel(f"[bold]Processing Query in Thinking Mode:[/bold] {user_query}", border_style="magenta"))
        
        filters = self.argo_system.extract_enhanced_filters_from_query(user_query)

        if filters.get('coords'):
            lat, lon = filters['coords']['lat'], filters['coords']['lon']
            metadata = self.argo_system.search_profiles_by_location(lat, lon)
            if not metadata:
                self.console.print("[red]❌ No floats found near that location.[/red]")
                return "No ARGO floats found near the specified location. Please try a different coordinate or ask about available data in other regions."
            table = Table(title=f"📍 Closest ARGO Floats to {lat:.2f}, {lon:.2f}", style="green")
            table.add_column("WMO ID", style="cyan")
            table.add_column("Location", style="white")
            table.add_column("Profiles", style="yellow")
            for meta in metadata:
                table.add_row(meta['wmo'], f"{meta['avg_latitude']:.2f}°, {meta['avg_longitude']:.2f}°", str(meta.get('n_profiles', 'N/A')))
            self.console.print(table)
            return f"Found {len(metadata)} ARGO floats near coordinates {lat:.2f}, {lon:.2f}. Please specify which float you'd like to analyze in detail."

        search_result = self.argo_system.get_relevant_wmo_ids(user_query)
        search_result['filters'].update(filters)
        
        if not search_result['wmo_ids']:
            self.console.print("[red]❌ No matching profiles found in metadata.[/red]")
            return "No matching ARGO profiles found for your query. Please try rephrasing your question or ask about available oceanographic data in different regions."

        detailed_data = self.argo_system.get_enhanced_postgres_data(search_result['wmo_ids'], search_result['filters'])
        if 'error' in detailed_data or not detailed_data.get('data'):
            error_message = detailed_data.get('error', 'No valid data returned.')
            self.console.print(Panel(f"[red]Data Retrieval Error:[/red] {error_message}", border_style="red"))
            return f"Data retrieval error: {error_message}. Please try a different query or check if the requested data is available."

        with self.console.status(f"[bold magenta]🧠 Deep thinking analysis in progress...[/]"):
            final_answer = self.ask_gemini_thinking_mode(user_query, chat_memory, detailed_data)
            
        self.console.print(Panel(final_answer, title="[bold magenta]Aqua's Deep Analysis[/]", border_style="magenta", expand=False))
        return final_answer

    def log_ollama_output(self, user_query, ollama_response):
        """Log the last user query and Ollama's response to a history file."""
        history = []
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, 'r') as f:
                    history = json.load(f)
            except json.JSONDecodeError:
                pass

        history.append({
            "timestamp": datetime.now().isoformat(),
            "query": user_query,
            "response": ollama_response
        })
        
        history = history[-MAX_HISTORY:]
        
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=4)
        
        self.console.print(f"[green]✅ Saved latest interaction to {HISTORY_FILE}[/green]")

    def get_ollama_history(self):
        """Retrieve the Ollama conversation history from file."""
        if not os.path.exists(HISTORY_FILE):
            return []
        try:
            with open(HISTORY_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            self.console.print("[red]❌ Error reading history file. It may be corrupted.[/red]")
            return []

    def analyze_history_with_gemini(self):
        """Use Gemini to analyze the Ollama history and plot a graph."""
        history = self.get_ollama_history()
        if not history:
            self.console.print("[yellow]No Ollama history found to analyze.[/yellow]")
            return

        history_text = "\n\n".join([f"User: {item['query']}\nOllama: {item['response']}" for item in history])
        prompt = f"Here is the conversation history with Ollama:\n\n{history_text}\n\nPlease analyze this history and provide a summary."
        
        with self.console.status("[bold cyan]🧠 Sending history to Gemini for analysis...[/]"):
            analysis = self.ask_gemini_enhanced(prompt)
            self.console.print(Panel(analysis, title="[bold magenta]Gemini's Analysis[/]", border_style="magenta", expand=False))
        
        self.create_response_graph(history)

    def create_response_graph(self, history):
        """Generate a bar chart of Ollama response lengths."""
        if not history: return
        
        queries = [item['query'] for item in history]
        response_lengths = [len(item['response']) for item in history]
        
        # Create a simple, clean graph
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.bar(range(len(queries)), response_lengths, color='skyblue')
        ax.set_ylabel('Response Length (Characters)', fontsize=12)
        ax.set_title('Length of Last 10 Ollama Responses', fontsize=14, fontweight='bold')
        ax.set_xticks(range(len(queries)))
        ax.set_xticklabels([f"Q{i+1}" for i in range(len(queries))])
        plt.xlabel('Query Number (most recent on the right)', fontsize=12)
        
        # Add a light grid for readability
        ax.grid(axis='y', linestyle='--', alpha=0.7)
        
        plt.tight_layout()
        
        # Save and display the graph
        graph_path = "ollama_response_graph.png"
        plt.savefig(graph_path)
        plt.close()
        
        self.console.print(f"[green]✅ Generated analysis graph: {graph_path}[/green]")
        # This will open the image file
        os.startfile(graph_path)