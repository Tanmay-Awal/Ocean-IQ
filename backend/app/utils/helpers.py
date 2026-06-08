import math
import base64
import numpy as np
import pandas as pd

def clean_nans(obj):
    """
    Recursively replaces NaN and Inf float values in python dicts/lists/values with None.
    Also decodes base64-encoded Plotly binary buffers ('bdata') into standard float lists,
    ensuring standard JSON compatibility for client-side parsers (e.g. JSON.parse in JS).
    """
    if isinstance(obj, dict):
        if 'bdata' in obj and 'dtype' in obj:
            try:
                raw_bytes = base64.b64decode(obj['bdata'])
                arr = np.frombuffer(raw_bytes, dtype=obj['dtype'])
                return clean_nans(arr.tolist())
            except Exception:
                pass
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nans(x) for x in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        val = float(obj)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    elif isinstance(obj, (np.ndarray, pd.Series, pd.Index)):
        return clean_nans(obj.tolist())
    return obj
