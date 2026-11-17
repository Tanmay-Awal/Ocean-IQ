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
