"""
OceanIQ Analysis Service
========================
Provides specialized oceanographic statistical calculations:
1. Thermocline depth detection (where temp drops fastest with depth).
2. Ocean mixed layer depth (MLD) calculation.
3. Anomaly detection (Z-score outliers).
4. T-S water mass classification.
5. Aggregations (mean, median, max, min, etc.).
"""

from __future__ import annotations

import logging
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class AnalysisService:
    @staticmethod
    def compute_aggregation(df: pd.DataFrame, parameter: str, agg_type: str) -> float | None:
        """
        Computes a statistical aggregation (mean, median, max, min, std, count)
        on a given parameter column.
        """
        if df.empty or parameter not in df.columns:
            return None
            
        series = pd.to_numeric(df[parameter], errors="coerce").dropna()
        if series.empty:
            return None
            
        agg_type = agg_type.lower()
        if agg_type in ["mean", "average"]:
            return float(series.mean())
        elif agg_type == "median":
            return float(series.median())
        elif agg_type == "max":
            return float(series.max())
        elif agg_type == "min":
            return float(series.min())
        elif agg_type in ["std", "deviation"]:
            return float(series.std())
        elif agg_type == "count":
            return float(len(series))
            
        return None

    @staticmethod
    def compute_thermocline_depth(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Detects the thermocline depth, defined as the depth (pressure) at which
        the temperature gradient (dT/dz) is maximized.
        """
        if df.empty or "temperature" not in df.columns or "pressure" not in df.columns:
            return {"error": "Missing temperature or pressure columns."}
            
        # Group by profile/cycle and compute gradient
        results = []
        
        # Sort by pressure (depth)
        df_sorted = df.dropna(subset=["temperature", "pressure"]).sort_values("pressure")
        
        # Group by cycle_number if populated, otherwise group by profile_date (daily)
        # Fast Vectorized Approach
        has_cyc = df_sorted["cycle_number"].notna() & (df_sorted["cycle_number"].astype(str).str.strip() != "") & (df_sorted["cycle_number"].astype(str).str.strip().str.lower() != "none")
        df_sorted["group_id"] = np.where(
            has_cyc,
            "cycle_" + df_sorted["cycle_number"].astype(str),
            "date_" + df_sorted["profile_date"].astype(str).str[:10]
        )
        groups = df_sorted.groupby("group_id")
        
        for g_name, profile_df in groups:
            profile_df = profile_df.sort_values("pressure")
            
            if len(profile_df) < 3:
                continue
                
            temps = profile_df["temperature"].values
            depths = profile_df["pressure"].values
            
            # Calculate gradients (dT/dz)
            gradients = np.abs(np.diff(temps) / np.diff(depths))
            if len(gradients) == 0:
                continue
                
            max_grad_idx = np.argmax(gradients)
            # Thermocline depth is at the midpoint of the interval with max gradient
            thermocline_depth = (depths[max_grad_idx] + depths[max_grad_idx + 1]) / 2.0
            temp_at_thermocline = (temps[max_grad_idx] + temps[max_grad_idx + 1]) / 2.0
            
            results.append({
                "cycle": str(g_name),
                "depth": float(thermocline_depth),
                "temperature": float(temp_at_thermocline),
                "max_gradient": float(gradients[max_grad_idx])
            })
            
        if not results:
            return {"error": "Insufficient vertical profile depth data to compute thermocline."}
            
        # Return average thermocline depth across profiles
        avg_depth = np.mean([r["depth"] for r in results])
        avg_temp = np.mean([r["temperature"] for r in results])
        max_grad = np.max([r["max_gradient"] for r in results])
        
        return {
            "avg_thermocline_depth_db": float(avg_depth),
            "avg_temperature_c": float(avg_temp),
            "max_gradient_c_db": float(max_grad),
            "profiles_analyzed": len(results),
            "details": results[:10]  # Limit detailed breakdown
        }

    @staticmethod
    def compute_mixed_layer_depth(df: pd.DataFrame, temp_threshold: float = 0.2) -> Dict[str, Any]:
        """
        Computes the Mixed Layer Depth (MLD) using the temperature threshold method:
        MLD is the depth at which the temperature changes by temp_threshold (e.g., 0.2°C)
        relative to the temperature at a reference surface depth (typically 10m / 10db).
        """
        if df.empty or "temperature" not in df.columns or "pressure" not in df.columns:
            return {"error": "Missing temperature or pressure columns."}
            
        df_sorted = df.dropna(subset=["temperature", "pressure"]).sort_values("pressure")
        
        # Group by cycle_number if populated, otherwise group by profile_date (daily)
        has_cyc = df_sorted["cycle_number"].notna() & (df_sorted["cycle_number"].astype(str).str.strip() != "") & (df_sorted["cycle_number"].astype(str).str.strip().str.lower() != "none")
        df_sorted["group_id"] = np.where(
            has_cyc,
            "cycle_" + df_sorted["cycle_number"].astype(str),
            "date_" + df_sorted["profile_date"].astype(str).str[:10]
        )
        groups = df_sorted.groupby("group_id")
        
        results = []
        
        for g_name, profile_df in groups:
            profile_df = profile_df.sort_values("pressure")
            
            if len(profile_df) < 5:
                continue
                
            depths = profile_df["pressure"].values
            temps = profile_df["temperature"].values
            
            # Find reference temperature at 10m (or first measurement below 5m and above 15m)
            ref_idx_list = np.where((depths >= 5.0) & (depths <= 15.0))[0]
            if len(ref_idx_list) == 0:
                # Fallback to the first shallowest measurement if 10m isn't exact
                ref_idx = 0
            else:
                ref_idx = ref_idx_list[0]
                
            ref_temp = temps[ref_idx]
            ref_depth = depths[ref_idx]
            
            # Find MLD (depth where temperature drops by temp_threshold from ref_temp)
            mld_depth = None
            for i in range(ref_idx + 1, len(temps)):
                if np.abs(temps[i] - ref_temp) >= temp_threshold:
                    # Linearly interpolate between i-1 and i for more accuracy
                    t1, t2 = temps[i-1], temps[i]
                    d1, d2 = depths[i-1], depths[i]
                    if t2 != t1:
                        fraction = (ref_temp - temp_threshold - t1) / (t2 - t1)
                        mld_depth = d1 + fraction * (d2 - d1)
                    else:
                        mld_depth = d2
                    break
                    
            if mld_depth is not None:
                results.append({
                    "cycle": str(g_name),
                    "mld_depth_db": float(mld_depth),
                    "ref_temp_c": float(ref_temp)
                })
                
        if not results:
            return {"error": "Could not identify mixed layer boundary in the profiles."}
            
        avg_mld = np.mean([r["mld_depth_db"] for r in results])
        avg_ref_temp = np.mean([r["ref_temp_c"] for r in results])
        
        return {
            "avg_mld_depth_db": float(avg_mld),
            "avg_surface_reference_temp_c": float(avg_ref_temp),
            "profiles_analyzed": len(results),
            "details": results[:10]
        }

    @staticmethod
    def compute_anomalies(df: pd.DataFrame, parameter: str, threshold: float = 2.5) -> Dict[str, Any]:
        """
        Performs Z-score anomaly detection to identify extreme outlier measurements
        (Z-score > threshold).
        """
        if df.empty or parameter not in df.columns:
            return {"error": f"Parameter '{parameter}' is missing or data is empty."}
            
        series = pd.to_numeric(df[parameter], errors="coerce").dropna()
        if len(series) < 5:
            return {"error": "Insufficient data to establish baseline statistics."}
            
        mean = series.mean()
        std = series.std()
        
        if std == 0:
            return {"error": "Standard deviation is zero, anomalies cannot be calculated."}
            
        z_scores = (series - mean) / std
        anomalies_mask = np.abs(z_scores) > threshold
        
        anomalies_df = df.loc[anomalies_mask.index[anomalies_mask]].copy()
        anomalies_df["z_score"] = z_scores[anomalies_mask]
        
        # Sort anomalies by absolute z-score descending
        anomalies_df["abs_z"] = anomalies_df["z_score"].abs()
        anomalies_df = anomalies_df.sort_values("abs_z", ascending=False).drop(columns=["abs_z"])
        
        return {
            "parameter": parameter,
            "mean": float(mean),
            "std": float(std),
            "threshold_z": threshold,
            "total_measurements": len(series),
            "anomaly_count": int(anomalies_mask.sum()),
            "anomalies": anomalies_df.head(20).to_dict("records")
        }

    @staticmethod
    def classify_water_masses(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Classifies water masses based on standard Indian Ocean temperature-salinity (T-S)
        relationships:
        1. BBW (Bay of Bengal Water): Temp > 25°C, Salinity < 33 PSU
        2. ASW (Arabian Sea Water): Temp > 24°C, Salinity > 35.5 PSU
        3. IIW (Indian Ocean Central Water): Temp 8-15°C, Salinity 34.5-35.0 PSU
        4. AAIW (Antarctic Intermediate Water): Temp 3-7°C, Salinity 34.0-34.5 PSU
        5. AABW (Antarctic Bottom Water): Temp < 2°C, Salinity 34.6-34.8 PSU
        """
        if df.empty or "temperature" not in df.columns or "salinity" not in df.columns:
            return {"error": "Missing temperature or salinity columns."}
            
        valid_df = df.dropna(subset=["temperature", "salinity"])
        total = len(valid_df)
        if total == 0:
            return {"error": "No valid temperature/salinity data pairs found."}
            
        classifications = {
            "Bay of Bengal Water (BBW)": 0,
            "Arabian Sea Water (ASW)": 0,
            "Indian Ocean Central Water (IIW)": 0,
            "Antarctic Intermediate Water (AAIW)": 0,
            "Antarctic Bottom Water (AABW)": 0,
            "Unclassified Water": 0
        }
        t = valid_df["temperature"]
        s = valid_df["salinity"]
        
        bbw = (t > 24.0) & (s < 33.5)
        asw = (t > 24.0) & (s > 35.5)
        iiw = (t >= 8.0) & (t <= 16.0) & (s >= 34.4) & (s <= 35.2)
        aaiw = (t >= 3.0) & (t <= 7.0) & (s >= 34.0) & (s <= 34.6)
        aabw = (t < 2.5) & (s >= 34.5) & (s <= 34.8)
        
        classifications["Bay of Bengal Water (BBW)"] = int(bbw.sum())
        classifications["Arabian Sea Water (ASW)"] = int(asw.sum())
        classifications["Indian Ocean Central Water (IIW)"] = int(iiw.sum())
        classifications["Antarctic Intermediate Water (AAIW)"] = int(aaiw.sum())
        classifications["Antarctic Bottom Water (AABW)"] = int(aabw.sum())
        
        classified_sum = int(bbw.sum() + asw.sum() + iiw.sum() + aaiw.sum() + aabw.sum())
        classifications["Unclassified Water"] = int(total - classified_sum)
                
        # Compute percentages
        breakdown = {}
        for name, count in classifications.items():
            breakdown[name] = {
                "count": count,
                "percentage": float((count / total) * 100)
            }
            
        return {
            "total_points_classified": total,
            "water_mass_breakdown": breakdown
        }
