import os
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PASSWORD"] = "test"
os.environ["WHATSAPP_API_KEY"] = "test"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "QAA AI Chatbot API" in response.json()["service"]


def test_webhook_verify():
    response = client.get("/webhook/whatsapp")
    assert response.status_code == 200
