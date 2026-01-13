import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

from unittest.mock import patch, MagicMock

def test_read_root():
    """menguji apakah API berjalan (endpoint root)"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Online"

def test_upload_no_file():
    """menguji validasi jika upload tanpa file"""
    response = client.post("/upload/")
    assert response.status_code == 422

def test_history():
    """menguji endpoint history"""
    response = client.get("/history/")
    assert response.status_code == 200
    assert "history" in response.json()

def test_download_not_found():
    """menguji download file yang tidak eksis"""
    response = client.get("/download/nonexistent.png")
    assert response.status_code == 404

@patch("main.AsyncResult")
def test_status_invalid_id(mock_async_result):
    """menguji status task yang tidak valid"""
    # Create a mock object for the task result
    mock_instance = MagicMock()
    mock_instance.state = "PENDING"
    mock_instance.result = None
    mock_async_result.return_value = mock_instance

    response = client.get("/status/invalid-task-id")
    assert response.status_code == 200
    assert response.json()["status"] == "PENDING"