"""
Unit tests for backend health check endpoints.
"""


def test_root_health_endpoint(client):
    """Test root / endpoint returns operational status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "oceaniq-backend"


def test_api_health_endpoint(client):
    """Test /api/health endpoint returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"


def test_shorthand_health_endpoint(client):
    """Test /health endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"


def test_floats_endpoint_returns_data(client):
    """Test /api/floats returns non-empty float telemetry metadata even without DB."""
    response = client.get("/api/floats")
    assert response.status_code == 200
    data = response.get_json()
    assert "floats" in data
    assert len(data["floats"]) > 0
    first = data["floats"][0]
    assert "wmo" in first
    assert "avg_latitude" in first
    assert "avg_longitude" in first


def test_dashboard_stats_endpoint(client):
    """Test /api/dashboard/stats returns populated HUD stats and regional coverage."""
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.get_json()
    assert "stats" in data
    stats = data["stats"]
    assert stats["totalFloats"] > 0
    assert stats["cachedProfiles"] > 0
    assert "avgTemperature" in stats
