"""
Pytest configuration and shared fixtures for OceanIQ backend.
"""

import sys
import os
import pytest

# Ensure backend root is on sys.path
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.server import app, _ip_request_timestamps


@pytest.fixture
def client():
    """Provides a Flask test client with test mode enabled."""
    app.config["TESTING"] = True
    _ip_request_timestamps.clear()  # reset rate limits before test
    with app.test_client() as client:
        yield client
