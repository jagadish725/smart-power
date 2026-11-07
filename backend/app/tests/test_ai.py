import pytest
import sys
import os

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.ai.model import PowerOptimizerAgent

@pytest.fixture
def agent():
    return PowerOptimizerAgent()

def test_model_loading(agent):
    assert agent.model is not None
    assert len(agent.classes_) == 4
    for expected_class in ["ABNORMAL", "HIGH_CONSUMPTION", "IDLE", "NORMAL"]:
        assert expected_class in agent.classes_

def test_idle_classification(agent):
    idle_payload = {
        "fan": {"voltage": 12.0, "current_ma": 0.0, "power_mw": 0.0, "relay_on": False},
        "led": {"voltage": 5.0, "current_ma": 0.0, "power_mw": 0.0, "relay_on": False},
        "total_power_mw": 0.0
    }
    decision = agent.process_cycle(idle_payload, mode="MANUAL")
    assert decision["classification"] == "IDLE"
    assert decision["suggested_action"] == "KEEP"

def test_normal_classification(agent):
    normal_payload = {
        "fan": {"voltage": 12.0, "current_ma": 240.0, "power_mw": 2880.0, "relay_on": True},
        "led": {"voltage": 5.0, "current_ma": 400.0, "power_mw": 2000.0, "relay_on": True},
        "total_power_mw": 4880.0
    }
    decision = agent.process_cycle(normal_payload, mode="MANUAL")
    assert decision["classification"] == "NORMAL"
    assert decision["suggested_action"] == "KEEP"

def test_abnormal_emergency_decision_in_auto_mode(agent):
    # Abnormal voltage sag and extreme current spike
    abnormal_payload = {
        "fan": {"voltage": 8.5, "current_ma": 900.0, "power_mw": 7650.0, "relay_on": True},
        "led": {"voltage": 3.9, "current_ma": 450.0, "power_mw": 1755.0, "relay_on": True},
        "total_power_mw": 9405.0
    }
    decision = agent.process_cycle(abnormal_payload, mode="AUTO")
    assert decision["classification"] == "ABNORMAL"
    assert decision["suggested_action"] == "EMERGENCY_SHUTDOWN"
    # In AUTO mode, both target relays must be commanded to False (OFF) for emergency protection
    assert decision["target_fan_relay"] is False
    assert decision["target_led_relay"] is False

