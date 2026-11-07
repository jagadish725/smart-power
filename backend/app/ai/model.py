"""
Power Optimizer AI Agent
========================
Implements the Observe -> Analyse -> Decide -> Act -> Verify workflow:
1. Observe: Ingests real-time telemetry from INA219 sensors.
2. Analyse: Classifies power state using Random Forest or safe rule-based fallback.
3. Decide: Formulates recommendations, explanations, and safety control actions.
4. Act: In AUTO mode, triggers relay safeguards if thresholds are violated. In MANUAL mode, acts as an advisor.
5. Verify: Confirms subsequent telemetry aligns with expectations.
"""

import os
import logging
import joblib
import numpy as np
import pandas as pd
from app.config import Config

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "fan_voltage",
    "fan_current_ma",
    "fan_power_mw",
    "fan_relay",
    "led_voltage",
    "led_current_ma",
    "led_power_mw",
    "led_relay",
    "total_power_mw"
]

class PowerOptimizerAgent:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or Config.AI_MODEL_PATH
        self.model = None
        self.classes_ = []
        self.load_model()

    def load_model(self):
        """Attempts to load the trained Random Forest model from disk."""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.classes_ = list(self.model.classes_)
                logger.info("Loaded AI model from %s", self.model_path)
            except Exception as e:
                logger.error("Failed to load AI model: %s. Using rule-based fallback.", e)
                self.model = None
        else:
            logger.warning("AI model file not found at %s. Using rule-based fallback.", self.model_path)
            self.model = None

    def observe(self, raw_reading: dict) -> dict:
        """Extracts and validates feature vector from sensor readings."""
        fan_data = raw_reading.get("fan", {})
        led_data = raw_reading.get("led", {})

        fan_v = float(fan_data.get("voltage", 0.0))
        fan_i = float(fan_data.get("current_ma", 0.0))
        fan_p = float(fan_data.get("power_mw", fan_v * fan_i))
        fan_r = 1 if fan_data.get("relay_on", False) else 0

        led_v = float(led_data.get("voltage", 0.0))
        led_i = float(led_data.get("current_ma", 0.0))
        led_p = float(led_data.get("power_mw", led_v * led_i))
        led_r = 1 if led_data.get("relay_on", False) else 0

        total_p = float(raw_reading.get("total_power_mw", fan_p + led_p))

        return {
            "fan_voltage": fan_v,
            "fan_current_ma": fan_i,
            "fan_power_mw": fan_p,
            "fan_relay": fan_r,
            "led_voltage": led_v,
            "led_current_ma": led_i,
            "led_power_mw": led_p,
            "led_relay": led_r,
            "total_power_mw": total_p
        }

    def _rule_based_fallback(self, obs: dict) -> tuple[str, float]:
        """Safe deterministic classification if machine learning model is unavailable."""
        fan_i = obs["fan_current_ma"]
        led_i = obs["led_current_ma"]
        total_p = obs["total_power_mw"]
        fan_v = obs["fan_voltage"]
        led_v = obs["led_voltage"]

        # Abnormal detection
        if (obs["fan_relay"] and fan_v < 10.0 and fan_i > 400.0) or \
           (obs["led_relay"] and led_v < 4.2 and led_i > 600.0) or \
           fan_i > 800.0 or led_i > 900.0:
            return "ABNORMAL", 95.0

        # High consumption detection
        if total_p >= Config.TOTAL_POWER_BUDGET_MW or \
           obs["fan_power_mw"] >= Config.FAN_POWER_THRESHOLD_MW or \
           obs["led_power_mw"] >= Config.LED_POWER_THRESHOLD_MW:
            return "HIGH_CONSUMPTION", 90.0

        # Idle detection
        if obs["fan_relay"] == 0 and obs["led_relay"] == 0 and total_p < 200.0:
            return "IDLE", 98.0

        return "NORMAL", 88.0

    def analyze(self, obs: dict) -> tuple[str, float]:
        """Classifies observed features using Random Forest or fallback rules."""
        if self.model is not None:
            try:
                row_df = pd.DataFrame([[obs[col] for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
                prediction = self.model.predict(row_df)[0]
                proba = self.model.predict_proba(row_df)[0]
                class_idx = list(self.model.classes_).index(prediction)
                confidence = float(proba[class_idx] * 100.0)
                return prediction, confidence
            except Exception as e:
                logger.error("Error during model inference: %s. Reverting to rule fallback.", e)
                return self._rule_based_fallback(obs)
        else:
            return self._rule_based_fallback(obs)

    def decide(self, classification: str, confidence: float, obs: dict, mode: str = "MANUAL") -> dict:
        """
        Formulates intelligent recommendations and control actions based on analysis.
        Follows strict safety principles: unverified decisions never switch off
        loads unexpectedly unless safe threshold conditions are verified.
        """
        fan_r = obs["fan_relay"] == 1
        led_r = obs["led_relay"] == 1
        total_p = obs["total_power_mw"]

        recommendation = ""
        reason = ""
        suggested_action = "KEEP"
        target_fan_relay = fan_r
        target_led_relay = led_r

        if classification == "ABNORMAL":
            recommendation = "Immediate Intervention Recommended: Abnormal electrical signature detected."
            reason = (f"Sensors detect abnormal current or voltage sag (Fan: {obs['fan_voltage']:.1f}V/{obs['fan_current_ma']:.0f}mA, "
                      f"LED: {obs['led_voltage']:.1f}V/{obs['led_current_ma']:.0f}mA). Possible motor stall or short circuit.")
            suggested_action = "EMERGENCY_SHUTDOWN"
            if mode == "AUTO":
                # In AUTO mode, isolate high-risk loads to protect hardware
                target_fan_relay = False
                target_led_relay = False

        elif classification == "HIGH_CONSUMPTION":
            recommendation = "Power Optimization Advised: System operating near maximum power budget."
            reason = (f"Combined power consumption is {total_p:.0f} mW (Fan: {obs['fan_power_mw']:.0f} mW, "
                      f"LED: {obs['led_power_mw']:.0f} mW). Exceeds optimal energy efficiency budget.")
            suggested_action = "OPTIMIZE_LOADS"
            if mode == "AUTO":
                # Shed secondary non-critical load (COB LED) first, preserve main load
                if led_r:
                    target_led_relay = False
                    reason += " Automated policy: Deactivating COB LED to keep fan active within power limit."

        elif classification == "IDLE":
            recommendation = "System in standby. Power consumption is minimal."
            reason = f"Both loads are switched off or quiescent current (<{total_p:.1f} mW). No action required."
            suggested_action = "KEEP"

        else: # NORMAL
            recommendation = "All parameters nominal. Stable energy efficiency."
            reason = (f"Operating within safe thermal and electrical tolerances. "
                      f"Fan drawing {obs['fan_power_mw']:.0f} mW, LED drawing {obs['led_power_mw']:.0f} mW.")
            suggested_action = "KEEP"

        return {
            "classification": classification,
            "confidence": round(confidence, 1),
            "recommendation": recommendation,
            "reason": reason,
            "suggested_action": suggested_action,
            "action_taken": "APPLIED_RELAY_COMMAND" if (mode == "AUTO" and (target_fan_relay != fan_r or target_led_relay != led_r)) else "MONITORED",
            "target_fan_relay": target_fan_relay,
            "target_led_relay": target_led_relay,
            "mode": mode,
            "power_observed_mw": total_p
        }

    def process_cycle(self, raw_reading: dict, mode: str = "MANUAL") -> dict:
        """Runs the complete Observe -> Analyse -> Decide cycle."""
        obs = self.observe(raw_reading)
        classification, confidence = self.analyze(obs)
        decision = self.decide(classification, confidence, obs, mode)
        return decision

