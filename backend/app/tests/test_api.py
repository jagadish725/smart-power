import pytest
import json
import sys
import os

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app import create_app
from app.database import init_db

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "ai_model" in data

def test_dashboard_endpoint(client):
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert "latest_reading" in data
    assert "devices" in data
    assert "analytics" in data
    assert "ai" in data

def test_devices_and_control(client):
    # 1. Get devices list
    res = client.get("/api/devices")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["devices"]) == 2

    # 2. Turn Fan ON
    res_ctrl = client.post("/api/devices/control", json={
        "device_id": "fan",
        "action": "ON"
    })
    assert res_ctrl.status_code == 200
    ctrl_data = res_ctrl.get_json()
    assert ctrl_data["device"]["status"] == "ON"
    assert ctrl_data["relay_states"]["fan"] is True

    # 3. Turn Fan OFF
    res_ctrl_off = client.post("/api/devices/control", json={
        "device_id": "fan",
        "action": "OFF"
    })
    assert res_ctrl_off.status_code == 200
    assert res_ctrl_off.get_json()["device"]["status"] == "OFF"

    # 4. Invalid device control
    res_invalid = client.post("/api/devices/control", json={
        "device_id": "unknown_device",
        "action": "ON"
    })
    assert res_invalid.status_code == 400

def test_operating_mode(client):
    # Switch to AUTO
    res = client.post("/api/mode", json={"mode": "AUTO"})
    assert res.status_code == 200
    assert res.get_json()["mode"] == "AUTO"

    # Switch back to MANUAL
    res2 = client.post("/api/mode", json={"mode": "MANUAL"})
    assert res2.status_code == 200
    assert res2.get_json()["mode"] == "MANUAL"

    # Invalid mode
    res_err = client.post("/api/mode", json={"mode": "INVALID_MODE"})
    assert res_err.status_code == 400

def test_readings_telemetry_flow(client):
    # Post realistic sensor telemetry (Simulating ESP32)
    payload = {
        "fan": {
            "voltage": 12.05,
            "current_ma": 220.5,
            "power_mw": 2657.0,
            "relay_on": True
        },
        "led": {
            "voltage": 4.98,
            "current_ma": 380.0,
            "power_mw": 1892.4,
            "relay_on": True
        },
        "is_simulated": False
    }

    res = client.post("/api/readings", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["status"] == "success"
    assert "commands" in data
    assert "ai_classification" in data

    # Verify latest reading endpoint
    res_latest = client.get("/api/readings/latest")
    assert res_latest.status_code == 200
    latest = res_latest.get_json()["reading"]
    assert latest["fan"]["voltage"] == 12.05
    assert latest["total_power_mw"] == pytest.approx(4549.4, 0.1)

def test_invalid_readings_payload(client):
    res = client.post("/api/readings", json={"invalid": "payload"})
    assert res.status_code == 400

