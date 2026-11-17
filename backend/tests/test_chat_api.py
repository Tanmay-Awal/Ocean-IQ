"""
Integration tests for conversational chat and rate limiting endpoints.
"""

from unittest.mock import patch


def test_chat_empty_query_returns_400(client):
    """POST /api/chat with empty query payload should return 400 Bad Request."""
    response = client.post("/api/chat", json={"query": ""})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_chat_missing_body_returns_400(client):
    """POST /api/chat with no body should return 400."""
    response = client.post("/api/chat", json={})
    assert response.status_code == 400


def test_chat_valid_query_mocked(client):
    """POST /api/chat with valid query returns expected payload contract."""
    mock_result = {
        "message": "The average salinity in the Arabian Sea is 36.2 PSU.",
        "graph_path": None,
        "graph_json": None,
        "attribution": {
            "source": "ARGO Fleet Float 2901234",
            "model_used": "groq/mock-test",
            "confidence": 0.95
        }
    }

    with patch("app.server.IntelligenceEngine.process_query", return_value=mock_result):
        response = client.post("/api/chat", json={"query": "What is the salinity?"})
        assert response.status_code == 200
        data = response.get_json()
        assert data["message"] == mock_result["message"]
        assert data["attribution"]["source"] == "ARGO Fleet Float 2901234"


def test_chat_rate_limiting_triggers_429(client):
    """Exceeding RATE_LIMIT_MAX_REQUESTS within window returns HTTP 429."""
    from app.server import RATE_LIMIT_MAX_REQUESTS

    mock_result = {
        "message": "ok",
        "attribution": {"source": "test"}
    }

    with patch("app.server.IntelligenceEngine.process_query", return_value=mock_result):
        for _ in range(RATE_LIMIT_MAX_REQUESTS):
            res = client.post("/api/chat", json={"query": "test"})
            assert res.status_code == 200

        # The subsequent request should be rate-limited
        rate_limited_res = client.post("/api/chat", json={"query": "test"})
        assert rate_limited_res.status_code == 429
        data = rate_limited_res.get_json()
        assert "Rate limit exceeded" in data["error"]
