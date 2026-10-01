from __future__ import annotations

from fastapi.testclient import TestClient

from browser_calculator.app import app

client = TestClient(app)


def test_index_serves_the_page() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_health_reports_ok() -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_evaluate_returns_the_result() -> None:
    response = client.post("/api/evaluate", json={"expression": "6 * 7"})
    assert response.status_code == 200
    assert response.json() == {"expression": "6 * 7", "result": 42}


def test_evaluate_rejects_bad_expression() -> None:
    response = client.post("/api/evaluate", json={"expression": "1 / 0"})
    assert response.status_code == 400
    assert response.json()["detail"] == "division by zero"


def test_evaluate_rejects_empty_expression() -> None:
    response = client.post("/api/evaluate", json={"expression": ""})
    assert response.status_code == 422


def test_evaluate_rejects_unsupported_expression() -> None:
    response = client.post("/api/evaluate", json={"expression": "abs(-1)"})
    assert response.status_code == 400


def test_evaluate_rejects_a_non_real_result() -> None:
    response = client.post("/api/evaluate", json={"expression": "(-1) ** 0.5"})
    assert response.status_code == 400
    assert response.json()["detail"] == "result is not a real number"


def test_static_asset_is_served() -> None:
    response = client.get("/static/app.js")
    assert response.status_code == 200
    assert "javascript" in response.headers["content-type"]


def test_openapi_lists_the_endpoint() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/api/evaluate" in response.json()["paths"]
