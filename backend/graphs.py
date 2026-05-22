"""
ARGO Graph Module - Standalone Visualization System
==================================================

This module contains all graph generation functionality for the ARGO system.
Can be used independently or imported into the main system.

Author: ARGO Team
Date: 2024
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns
from datetime import datetime, timedelta
from pathlib import Path
import warnings
import re
import os 
from pathlib import Path
from datetime import datetime
import matplotlib.pyplot as plt

warnings.filterwarnings('ignore')

class ArgoGraphGenerator:
    """
    Standalone graph generation class for ARGO oceanographic data.
    """
    
    def __init__(self, output_dir="./graphs"):
        """Initialize the graph generator."""
        self.graphs_dir = Path(output_dir)
        
        # Create directories if they don't exist
        self.graphs_dir.mkdir(exist_ok=True)
        
        # Set up matplotlib style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        print(f"📊 ARGO Graph Generator initialized")
        print(f"   - Graphs directory: {self.graphs_dir}")

    def detect_graph_request(self, query_text):
        """Detect if user is requesting a graph/plot/visualization."""
        graph_keywords = [
            'plot', 'graph', 'chart', 'visualize', 'show graph', 'draw', 'make',
            'histogram', 'scatter', 'line plot', 'bar chart', 'time series',
            'profile plot', 'depth profile', 'trajectory', 'map', 'heatmap',
            'trends', 'trend', 'over time', 'past'
        ]
        query_lower = query_text.lower()
        return any(keyword in query_lower for keyword in graph_keywords)

    def determine_graph_type(self, query_text, data):
        """Determine the most appropriate graph type based on query and data."""
        query_lower = query_text.lower()
        df = pd.DataFrame(data) if not isinstance(data, pd.DataFrame) else data
        
        # Time series plots (including trends)
        if any(word in query_lower for word in ['time series', 'over time', 'temporal', 'trends', 'trend', 'past']):
            return 'time_series'
        
        # Depth profiles
        if any(word in query_lower for word in ['depth profile', 'vertical profile', 'profile']):
            return 'depth_profile'
        
        # Scatter plots
        if any(word in query_lower for word in ['scatter', 'correlation', 'relationship']):
            return 'scatter'
        
        # Histograms
        if any(word in query_lower for word in ['histogram', 'distribution', 'frequency']):
            return 'histogram'
        
        # Map/trajectory
        if any(word in query_lower for word in ['map', 'location', 'trajectory', 'spatial']):
            return 'map'
        
        # Default based on data structure
        if 'pressure' in df.columns and len(df) > 10:
            return 'depth_profile'
        elif 'profile_date' in df.columns and len(df) > 5:
            return 'time_series'
        else:
            return 'scatter'

    def create_depth_profile_plot(self, data, title="Ocean Depth Profile"):
        """Create a depth profile plot (Temperature/Salinity vs Depth)."""
        df = pd.DataFrame(data) if not isinstance(data, pd.DataFrame) else data
        
        fig, axes = plt.subplots(1, 2, figsize=(12, 8), sharey=True)
        
        # Temperature profile
        if 'temperature' in df.columns and 'pressure' in df.columns:
            temp_data = df.dropna(subset=['temperature', 'pressure'])
            if not temp_data.empty:
                axes[0].plot(temp_data['temperature'], temp_data['pressure'], 'b-o', 
                           markersize=3, linewidth=1.5, label='Temperature')
                axes[0].set_xlabel('Temperature (°C)', fontsize=12)
                axes[0].set_ylabel('Pressure (dbar)', fontsize=12)
                axes[0].set_title('Temperature Profile', fontsize=14)
                axes[0].invert_yaxis()
                axes[0].grid(True, alpha=0.3)
                axes[0].legend()
        
        # Salinity profile
        if 'salinity' in df.columns and 'pressure' in df.columns:
            sal_data = df.dropna(subset=['salinity', 'pressure'])
            if not sal_data.empty:
                axes[1].plot(sal_data['salinity'], sal_data['pressure'], 'r-o', 
                           markersize=3, linewidth=1.5, label='Salinity')
                axes[1].set_xlabel('Salinity (PSU)', fontsize=12)
                axes[1].set_title('Salinity Profile', fontsize=14)
                axes[1].invert_yaxis()
                axes[1].grid(True, alpha=0.3)
                axes[1].legend()
        
        plt.suptitle(title, fontsize=16, y=0.95)
        plt.tight_layout()
        return fig

    def create_time_series_plot(self, data, title="Time Series Analysis"):
        """Create time series plots for oceanographic parameters."""
        df = pd.DataFrame(data) if not isinstance(data, pd.DataFrame) else data
        
        if 'profile_date' not in df.columns:
            return None
            
        df['profile_date'] = pd.to_datetime(df['profile_date'])
        df = df.sort_values('profile_date')
        
        # Determine number of subplots needed
        plot_cols = ['temperature', 'salinity', 'dissolved_oxygen']
        available_cols = [col for col in plot_cols if col in df.columns and df[col].notna().any()]
        
        if not available_cols:
            return None
            
        fig, axes = plt.subplots(len(available_cols), 1, figsize=(12, 4 * len(available_cols)), sharex=True)
        if len(available_cols) == 1:
            axes = [axes]
        
        colors = ['blue', 'red', 'green']
        units = {'temperature': '°C', 'salinity': 'PSU', 'dissolved_oxygen': 'μmol/kg'}
        
        for i, col in enumerate(available_cols):
            col_data = df.dropna(subset=[col, 'profile_date'])
            if not col_data.empty:
                # Group by date and take mean for multiple measurements per day
                daily_data = col_data.groupby(col_data['profile_date'].dt.date)[col].mean()
                
                axes[i].plot(daily_data.index, daily_data.values, 
                           color=colors[i], marker='o', markersize=4, linewidth=1.5)
                axes[i].set_ylabel(f"{col.title()} ({units.get(col, '')})", fontsize=12)
                axes[i].set_title(f"{col.title()} Over Time", fontsize=14)
                axes[i].grid(True, alpha=0.3)
                
                # Add trend line
                if len(daily_data) > 1:
                    z = np.polyfit(range(len(daily_data)), daily_data.values, 1)
                    p = np.poly1d(z)
                    axes[i].plot(daily_data.index, p(range(len(daily_data))), 
                               "--", alpha=0.8, color='red', 
                               label=f"Trend: {z[0]:.3f} {units.get(col, '')}/day")
                    axes[i].legend()
                
        axes[-1].set_xlabel('Date', fontsize=12)
        axes[-1].xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        axes[-1].xaxis.set_major_locator(mdates.MonthLocator(interval=1))
        plt.xticks(rotation=45)
        
        plt.suptitle(title, fontsize=16, y=0.98)
        plt.tight_layout()
        return fig

    def create_scatter_plot(self, data, title="Parameter Correlation"):
        """Create scatter plots showing relationships between parameters."""
        df = pd.DataFrame(data) if not isinstance(data, pd.DataFrame) else data
        
        # Find best parameter pairs
        numeric_cols = ['temperature', 'salinity', 'dissolved_oxygen', 'pressure']
        available_cols = [col for col in numeric_cols if col in df.columns and df[col].notna().any()]
        
        if len(available_cols) < 2:
            return None
            
        fig, axes = plt.subplots(1, min(2, len(available_cols)-1), figsize=(12, 5))
        if min(2, len(available_cols)-1) == 1:
            axes = [axes]
        
        # Temperature vs Salinity
        if 'temperature' in available_cols and 'salinity' in available_cols:
            temp_sal_data = df.dropna(subset=['temperature', 'salinity'])
            if not temp_sal_data.empty:
                scatter = axes[0].scatter(temp_sal_data['temperature'], temp_sal_data['salinity'], 
                              alpha=0.6, c=temp_sal_data.get('pressure', 'blue'), 
                              cmap='viridis', s=30)
                axes[0].set_xlabel('Temperature (°C)', fontsize=12)
                axes[0].set_ylabel('Salinity (PSU)', fontsize=12)
                axes[0].set_title('Temperature vs Salinity', fontsize=14)
                axes[0].grid(True, alpha=0.3)
                
                if 'pressure' in temp_sal_data.columns:
                    plt.colorbar(scatter, ax=axes[0], label='Pressure (dbar)')
        
        # Temperature vs Oxygen (if available)
        if len(axes) > 1 and 'temperature' in available_cols and 'dissolved_oxygen' in available_cols:
            temp_oxy_data = df.dropna(subset=['temperature', 'dissolved_oxygen'])
            if not temp_oxy_data.empty:
                axes[1].scatter(temp_oxy_data['temperature'], temp_oxy_data['dissolved_oxygen'], 
                              alpha=0.6, color='red', s=30)
                axes[1].set_xlabel('Temperature (°C)', fontsize=12)
                axes[1].set_ylabel('Dissolved Oxygen (μmol/kg)', fontsize=12)
                axes[1].set_title('Temperature vs Dissolved Oxygen', fontsize=14)
                axes[1].grid(True, alpha=0.3)
        
        plt.suptitle(title, fontsize=16, y=0.98)
        plt.tight_layout()
        return fig

    def create_histogram_plot(self, data, title="Parameter Distribution"):
        """Create histogram plots for parameter distributions."""
        df = pd.DataFrame(data) if not isinstance(data, pd.DataFrame) else data
        
        plot_cols = ['temperature', 'salinity', 'dissolved_oxygen']
        available_cols = [col for col in plot_cols if col in df.columns and df[col].notna().any()]
        
        if not available_cols:
            return None
            
        fig, axes = plt.subplots(1, min(3, len(available_cols)), figsize=(15, 5))
        if min(3, len(available_cols)) == 1:
            axes = [axes]
        elif min(3, len(available_cols)) == 2:
            axes = list(axes)
        
        colors = ['blue', 'red', 'green']
        units = {'temperature': '°C', 'salinity': 'PSU', 'dissolved_oxygen': 'μmol/kg'}
        
        for i, col in enumerate(available_cols[:3]):
            col_data = df[col].dropna()
            if not col_data.empty:
                n, bins, patches = axes[i].hist(col_data, bins=30, alpha=0.7, 
                                              color=colors[i], edgecolor='black')
                axes[i].set_xlabel(f"{col.title()} ({units.get(col, '')})", fontsize=12)
                axes[i].set_ylabel('Frequency', fontsize=12)
                axes[i].set_title(f"{col.title()} Distribution", fontsize=14)
                axes[i].grid(True, alpha=0.3)
                
                # Add statistics
                mean_val = col_data.mean()
                std_val = col_data.std()
                axes[i].axvline(mean_val, color='red', linestyle='--', linewidth=2, 
                              label=f'Mean: {mean_val:.2f}')
                axes[i].axvline(mean_val + std_val, color='orange', linestyle=':', 
                              alpha=0.7, label=f'+1σ: {mean_val + std_val:.2f}')
                axes[i].axvline(mean_val - std_val, color='orange', linestyle=':', 
                              alpha=0.7, label=f'-1σ: {mean_val - std_val:.2f}')
                axes[i].legend()
        
        plt.suptitle(title, fontsize=16, y=0.98)
        plt.tight_layout()
        return fig

    def create_location_map(self, data, title="ARGO Float Locations"):
        """Create a simple location map of ARGO floats."""
        df = pd.DataFrame(data) if not isinstance(data, pd.DataFrame) else data
        
        if 'latitude' not in df.columns or 'longitude' not in df.columns:
            return None
            
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        
        # Create scatter plot of locations
        scatter = ax.scatter(df['longitude'], df['latitude'], 
                           c=df.get('temperature', 'blue'), 
                           cmap='coolwarm', alpha=0.7, s=50)
        
        ax.set_xlabel('Longitude', fontsize=12)
        ax.set_ylabel('Latitude', fontsize=12)
        ax.set_title(title, fontsize=16)
        ax.grid(True, alpha=0.3)
        
        # Add colorbar if temperature data is available
        if 'temperature' in df.columns:
            cbar = plt.colorbar(scatter, ax=ax)
            cbar.set_label('Temperature (°C)', fontsize=12)
        
        # Add float count annotation
        ax.text(0.02, 0.98, f'Total Floats: {len(df)}', 
                transform=ax.transAxes, fontsize=12, 
                verticalalignment='top', 
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        plt.tight_layout()
        return fig
        
    def save_graph(self, fig, filename_prefix="argo_plot"):
        """Save graph to the main graphs directory."""
        if fig is None:
            return None
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.png"
        
        filepath = self.graphs_dir / filename
        
        fig.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        
        print(f"📊 Graph saved: {filepath}")
        return str(filepath)
    
    # NEW: Function to delete old graphs
    def clean_up_graphs_folder(self):
        """Deletes all files in a specified folder to ensure it's clean."""
        if not self.graphs_dir.is_dir():
            print(f"❌ Folder not found for cleanup: {self.graphs_dir}")
            return
        
        for file in self.graphs_dir.glob("*.png"):
            if file.is_file():
                try:
                    os.remove(file)
                    print(f"🗑️ Cleaned up old graph: {file}")
                except OSError as e:
                    print(f"❌ Error deleting file {file}: {e}")
    
    # NEW: This is the core function that orchestrates graph generation
    def generate_graph_from_data(self, query_text, data):
        """
        Main graph generation function that takes structured data.
        It cleans up the folder and then generates the new graph.
        """
        if data is None or not data:
            print("❌ No data provided for graph generation.")
            return None
            
        self.clean_up_graphs_folder()
        
        graph_type = self.determine_graph_type(query_text, data)
        print(f"📊 Generating {graph_type} plot...")
        
        fig = None
        filename_prefix = "argo_plot"
        
        try:
            if graph_type == 'depth_profile':
                fig = self.create_depth_profile_plot(data)
                filename_prefix = "depth_profile"
                
            elif graph_type == 'time_series':
                fig = self.create_time_series_plot(data)
                filename_prefix = "time_series"
                
            elif graph_type == 'scatter':
                fig = self.create_scatter_plot(data)
                filename_prefix = "scatter_plot"
                
            elif graph_type == 'histogram':
                fig = self.create_histogram_plot(data)
                filename_prefix = "histogram"
                
            elif graph_type == 'map':
                fig = self.create_location_map(data)
                filename_prefix = "location_map"
                
        except Exception as e:
            print(f"❌ Error creating {graph_type} plot: {e}")
            return None
        
        if fig:
            filepath = self.save_graph(fig, filename_prefix)
            return filepath
        
        return None