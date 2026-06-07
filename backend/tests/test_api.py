from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_endpoint_includes_disclaimer() -> None:
    response = client.post("/chat", json={"message": "I have persistent cough and fatigue"})
    assert response.status_code == 200
    body = response.json()
    assert "response" in body
    assert "consult" in body["response"].lower() or "disclaimer" in body["response"].lower()
