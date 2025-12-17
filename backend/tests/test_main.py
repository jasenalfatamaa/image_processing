import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    """menguji apakah API berjalan (endpoint root)"""
    response = client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()

def test_upload_no_file():
    """menguji validasi jika upload tanpa file"""
    response = client.post("/upload/")
    assert response.status_code == 422  # Unprocessable Entity

def test_task_status_invalid_id():
    """menguji respon jika tast ID tidak ditemukan"""
    response = client.get("/status/invalid-id")
    # tergantung logic, biasanya 404 atau SUCCESS/PENDING
    assert response.status_code in [200, 404]