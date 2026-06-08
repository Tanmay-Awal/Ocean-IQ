"""
OceanIQ Graph Service
=====================
Generates Plotly interactive chart JSON objects for the frontend:
1. Vertical Depth Profiles.
2. Time Series trends.
3. Temperature-Salinity (T-S) Scatter Diagrams.
4. Hovmöller time-depth grids.
5. Geographical Trajectory Maps.
"""

from __future__ import annotations

import json
import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.utils import PlotlyJSONEncoder

logger = logging.getLogger(__name__)


class GraphService:
    @staticmethod
    def serialize_fig(fig: go.Figure) -> Dict[str, Any]:
        """Serializes a Plotly figure to a JSON-compatible dictionary."""
        # Clean background styles for our dark-mode deep ocean theme
        fig.update_layout(
            paper_bgcolor="rgba(10, 25, 47, 0.0)",  # transparent navy
            plot_bgcolor="rgba(10, 25, 47, 0.0)",
            font=dict(color="#8892b0", family="Outfit, Inter, sans-serif"),
            title=dict(font=dict(color="#ccd6f6", size=16)),
            legend=dict(font=dict(color="#8892b0")),
        )
        fig.update_xaxes(
            gridcolor="rgba(35, 53, 84, 0.3)",
            linecolor="rgba(35, 53, 84, 0.5)",
            zerolinecolor="rgba(35, 53, 84, 0.5)"
        )
        fig.update_yaxes(
            gridcolor="rgba(35, 53, 84, 0.3)",
            linecolor="rgba(35, 53, 84, 0.5)",
            zerolinecolor="rgba(35, 53, 84, 0.5)"
        )
        
        # Convert to JSON using encoder, then back to dictionary
        encoded = json.dumps(fig, cls=PlotlyJSONEncoder)
        return json.loads(encoded)

    @classmethod
    def generate_depth_profile(cls, df: pd.DataFrame, title: str = "Ocean Depth Profile") -> Dict[str, Any]:
        """Creates a dual-axis vertical profile plot for Temperature and Salinity vs Pressure."""
        if df.empty or "pressure" not in df.columns:
            return {"error": "Missing depth/pressure data."}
            
        fig = go.Figure()
        
        # Sort by pressure descending (deepest at bottom)
        df_sorted = df.dropna(subset=["pressure"]).sort_values("pressure")
        
        # Group by WMO to plot multiple lines if needed
        wmos = df_sorted["wmo"].unique()
        
        show_temp = "temperature" in df_sorted.columns and df_sorted["temperature"].notna().any()
        show_sal = "salinity" in df_sorted.columns and df_sorted["salinity"].notna().any()
        
        for wmo in wmos:
            wmo_df = df_sorted[df_sorted["wmo"] == wmo]
            
            if show_temp:
                fig.add_trace(go.Scatter(
                    x=wmo_df["temperature"],
                    y=wmo_df["pressure"],
                    mode="lines+markers",
                    name=f"WMO {wmo} Temp (°C)",
                    line=dict(color="#00f2fe", width=2),
                    marker=dict(size=4),
                    xaxis="x1"
                ))
                
            if show_sal:
                fig.add_trace(go.Scatter(
                    x=wmo_df["salinity"],
                    y=wmo_df["pressure"],
                    mode="lines+markers",
                    name=f"WMO {wmo} Salinity (PSU)",
                    line=dict(color="#4facfe", width=2, dash="dash"),
                    marker=dict(size=4),
                    xaxis="x2"
                ))
                
        # Layout configurations
        fig.update_layout(
            title=title,
            yaxis=dict(
                title="Pressure / Depth (dbar)",
                autorange="reversed",  # Invert axis: shallow at top, deep at bottom
            ),
            xaxis=dict(
                title=dict(text="Temperature (°C)", font=dict(color="#00f2fe")),
                tickfont=dict(color="#00f2fe")
            ),
            xaxis2=dict(
                title=dict(text="Salinity (PSU)", font=dict(color="#4facfe")),
                tickfont=dict(color="#4facfe"),
                overlaying="x",
                side="top"
            ),
            hovermode="y unified"
        )
        
        return cls.serialize_fig(fig)

    @classmethod
    def generate_time_series(cls, df: pd.DataFrame, parameter: str = "temperature", title: str = "Parameter Trend Analysis") -> Dict[str, Any]:
        """Creates a time series plot for a parameter, calculating average daily readings."""
        if df.empty or "profile_date" not in df.columns or parameter not in df.columns:
            return {"error": f"Missing columns required for time series: {parameter}"}
            
        df_clean = df.dropna(subset=["profile_date", parameter]).copy()
        df_clean["profile_date"] = pd.to_datetime(df_clean["profile_date"])
        df_clean = df_clean.sort_values("profile_date")
        
        # Resample or group by day/month to get clean averages
        df_clean["date_only"] = df_clean["profile_date"].dt.date
        grouped = df_clean.groupby(["wmo", "date_only"])[parameter].mean().reset_index()
        
        fig = go.Figure()
        
        param_label = "Temperature (°C)" if parameter == "temperature" else ("Salinity (PSU)" if parameter == "salinity" else "Dissolved Oxygen (μmol/kg)")
        color_map = {"temperature": "#00f2fe", "salinity": "#4facfe", "dissolved_oxygen": "#10b981"}
        color = color_map.get(parameter, "#3b82f6")
        
        wmos = grouped["wmo"].unique()
        for wmo in wmos:
            wmo_df = grouped[grouped["wmo"] == wmo]
            fig.add_trace(go.Scatter(
                x=wmo_df["date_only"],
                y=wmo_df[parameter],
                mode="lines+markers",
                name=f"WMO {wmo}",
                line=dict(color=color, width=2),
                marker=dict(size=4)
            ))
            
            # Simple trendline if enough points
            if len(wmo_df) > 3:
                x_vals = np.arange(len(wmo_df))
                y_vals = wmo_df[parameter].values
                z = np.polyfit(x_vals, y_vals, 1)
                p = np.poly1d(z)
                
                fig.add_trace(go.Scatter(
                    x=wmo_df["date_only"],
                    y=p(x_vals),
                    mode="lines",
                    name=f"WMO {wmo} Trend ({z[0]*30:.4f}/mo)",
                    line=dict(dash="dot", width=1.5, color="red"),
                    opacity=0.7
                ))
                
        fig.update_layout(
            title=title,
            xaxis=dict(title="Date"),
            yaxis=dict(title=param_label),
            hovermode="x unified"
        )
        
        return cls.serialize_fig(fig)

    @classmethod
    def generate_ts_diagram(cls, df: pd.DataFrame, title: str = "Temperature-Salinity (T-S) Diagram") -> Dict[str, Any]:
        """Creates a standard oceanographic T-S scatter diagram colored by pressure (depth)."""
        if df.empty or "temperature" not in df.columns or "salinity" not in df.columns:
            return {"error": "Missing temperature or salinity data."}
            
        df_clean = df.dropna(subset=["temperature", "salinity", "pressure"])
        
        fig = px.scatter(
            df_clean,
            x="salinity",
            y="temperature",
            color="pressure",
            labels={
                "salinity": "Salinity (PSU)",
                "temperature": "Temperature (°C)",
                "pressure": "Pressure (dbar)"
            },
            color_continuous_scale="Viridis",
            title=title,
        )
        
        fig.update_traces(marker=dict(size=6, opacity=0.7))
        fig.update_layout(
            coloraxis_colorbar=dict(title="Depth (dbar)", reverse=True)
        )
        
        return cls.serialize_fig(fig)

    @classmethod
    def generate_trajectory_map(cls, df: pd.DataFrame, title: str = "ARGO Float Trajectories") -> Dict[str, Any]:
        """Creates a geographical trajectory map of float movements."""
        if df.empty or "latitude" not in df.columns or "longitude" not in df.columns:
            return {"error": "Missing coordinates data."}
            
        df_clean = df.dropna(subset=["latitude", "longitude", "profile_date"]).copy()
        df_clean["profile_date"] = pd.to_datetime(df_clean["profile_date"])
        df_clean = df_clean.sort_values("profile_date")
        
        # Deduplicate positions per float per day to get clean path
        df_clean["date_only"] = df_clean["profile_date"].dt.date
        path_df = df_clean.groupby(["wmo", "date_only"]).first().reset_index()
        
        fig = go.Figure()
        
        wmos = path_df["wmo"].unique()
        colors = ["#00f2fe", "#4facfe", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]
        
        for i, wmo in enumerate(wmos):
            wmo_df = path_df[path_df["wmo"] == wmo]
            color = colors[i % len(colors)]
            
            # Add trajectory line
            fig.add_trace(go.Scattergeo(
                lon=wmo_df["longitude"],
                lat=wmo_df["latitude"],
                mode="lines+markers",
                name=f"Float {wmo}",
                line=dict(width=2, color=color),
                marker=dict(size=6, color=color, symbol="circle")
            ))
            
            # Highlight latest position with a star
            if not wmo_df.empty:
                latest = wmo_df.iloc[-1]
                fig.add_trace(go.Scattergeo(
                    lon=[latest["longitude"]],
                    lat=[latest["latitude"]],
                    mode="markers",
                    name=f"WMO {wmo} Latest",
                    marker=dict(size=14, color=color, symbol="star", line=dict(color="white", width=1)),
                    showlegend=False
                ))
                
        fig.update_layout(
            title=title,
            geo=dict(
                projection_type="natural earth",
                showland=True,
                landcolor="rgba(30, 41, 59, 0.8)",  # dark gray land
                showocean=True,
                oceancolor="rgba(10, 25, 47, 0.9)",  # deep blue ocean
                showcountries=True,
                countrycolor="rgba(71, 85, 105, 0.5)",
                lonaxis=dict(showgrid=True, gridcolor="rgba(71, 85, 105, 0.2)"),
                lataxis=dict(showgrid=True, gridcolor="rgba(71, 85, 105, 0.2)"),
                # Center around the Indian Ocean
                center=dict(lat=5, lon=75),
                projection_scale=1.8
            ),
            margin=dict(l=0, r=0, t=40, b=0)
        )
        
        return cls.serialize_fig(fig)

    @classmethod
    def generate_hovmoller(cls, df: pd.DataFrame, parameter: str = "temperature", title: str = "Hovmöller Diagram (Depth vs Time)") -> Dict[str, Any]:
        """
        Creates a Hovmöller diagram (depth vs time heatmap) for a parameter.
        Bins depth (pressure) and time to construct a regular grid.
        """
        if df.empty or "profile_date" not in df.columns or "pressure" not in df.columns or parameter not in df.columns:
            return {"error": "Missing columns required for Hovmöller analysis."}
            
        df_clean = df.dropna(subset=["profile_date", "pressure", parameter]).copy()
        df_clean["profile_date"] = pd.to_datetime(df_clean["profile_date"])
        
        # Bin pressure into intervals (e.g., every 50 dbar up to 1000 dbar)
        df_clean["depth_bin"] = pd.cut(df_clean["pressure"], bins=np.arange(0, 1050, 50), labels=np.arange(25, 1025, 50))
        # Group time by month
        df_clean["year_month"] = df_clean["profile_date"].dt.to_period("M").astype(str)
        
        # Aggregate parameter
        grid_df = df_clean.groupby(["depth_bin", "year_month"])[parameter].mean().unstack(level=1)
        grid_df = grid_df.dropna(how="all").interpolate(axis=0).interpolate(axis=1)
        
        if grid_df.empty:
            return {"error": "Insufficient grid resolution to generate heatmap."}
            
        # Plotly heatmap
        fig = go.Figure(data=go.Heatmap(
            z=grid_df.values,
            x=grid_df.columns,
            y=grid_df.index,
            colorscale="Thermal" if parameter == "temperature" else "Haline",
            colorbar=dict(title="Temp (°C)" if parameter == "temperature" else "Salinity (PSU)")
        ))
        
        fig.update_layout(
            title=title,
            xaxis=dict(title="Time"),
            yaxis=dict(title="Pressure / Depth (dbar)", autorange="reversed"),
        )
        
        return cls.serialize_fig(fig)
