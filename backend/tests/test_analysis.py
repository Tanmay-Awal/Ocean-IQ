"""
Unit tests for oceanographic AnalysisService algorithms.
"""

import pandas as pd
import numpy as np
from app.services.analysis_service import AnalysisService


def test_compute_aggregation_mean():
    """Verify mean computation on synthetic temperature series."""
    df = pd.DataFrame({"temperature": [28.0, 26.0, 24.0, 22.0]})
    result = AnalysisService.compute_aggregation(df, "temperature", "mean")
    assert result == 25.0


def test_compute_aggregation_empty_df():
    """Empty dataframe should gracefully return None without raising exceptions."""
    df = pd.DataFrame()
    result = AnalysisService.compute_aggregation(df, "temperature", "mean")
    assert result is None


def test_compute_aggregation_missing_parameter():
    """Querying non-existent column returns None."""
    df = pd.DataFrame({"salinity": [35.0, 36.0]})
    result = AnalysisService.compute_aggregation(df, "temperature", "max")
    assert result is None


def test_compute_mixed_layer_depth_synthetic():
    """Verify mixed layer depth calculation with synthetic profile."""
    # Near surface constant temp, then sharp gradient
    df = pd.DataFrame({
        "pressure": [5.0, 10.0, 20.0, 50.0, 100.0],
        "temperature": [28.5, 28.4, 28.3, 25.0, 18.0]
    })
    mld = AnalysisService.compute_mixed_layer_depth(df)
    assert isinstance(mld, dict)
    assert "avg_mld_depth_db" in mld
    assert mld["avg_mld_depth_db"] == 20.0


def test_compute_thermocline_depth_synthetic():
    """Verify thermocline depth detection where temperature gradient is steepest."""
    df = pd.DataFrame({
        "pressure": [10.0, 50.0, 100.0, 150.0],
        "temperature": [28.0, 27.5, 20.0, 18.0]
    })
    therm = AnalysisService.compute_thermocline_depth(df)
    assert isinstance(therm, dict)
    assert "avg_thermocline_depth_db" in therm
