"""
AI Agent Service
================
Orchestrates AI observations, state classifications, decisions, and closed-loop
control between the machine learning engine, database, and hardware controller.
"""

import os
import json
import logging
from datetime import datetime, timezone
from app.config import Config
from app.database import SessionLocal, get_supabase
from app.models import AIDecision, SystemSetting
from app.ai.model import PowerOptimizerAgent
from app.services.device_service import DeviceService

logger = logging.getLogger(__name__)

# Singleton Agent Instance
agent_instance = PowerOptimizerAgent()

class AIAgentService:
    @staticmethod
    def get_agent():
        global agent_instance
        if agent_instance.model is None:
            agent_instance.load_model()
        return agent_instance

    @staticmethod
    def get_operating_mode() -> str:
        session = SessionLocal()
        try:
            setting = session.query(SystemSetting).filter_by(setting_key="operating_mode").first()
            return setting.setting_value.upper() if setting else "MANUAL"
        finally:
            session.close()

    @staticmethod
    def set_operating_mode(new_mode: str) -> str:
        new_mode = new_mode.upper().strip()
        if new_mode not in ["AUTO", "MANUAL"]:
            raise ValueError(f"Invalid mode '{new_mode}'. Allowed: AUTO, MANUAL")

        session = SessionLocal()
        try:
            setting = session.query(SystemSetting).filter_by(setting_key="operating_mode").first()
            if not setting:
                setting = SystemSetting(setting_key="operating_mode", setting_value=new_mode)
                session.add(setting)
            else:
                setting.setting_value = new_mode
                setting.updated_at = datetime.now(timezone.utc)
            session.commit()

            # Optional: Sync to Supabase
            sb = get_supabase()
            if sb:
                try:
                    sb.table("system_settings").upsert({
                        "setting_key": "operating_mode",
                        "setting_value": new_mode,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }).execute()
                except Exception as e:
                    logger.warning("Failed to sync mode to Supabase: %s", e)

            return new_mode
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    @staticmethod
    def evaluate_and_decide(reading_dict: dict) -> dict:
        """
        Executes the AI optimization loop on the current reading.
        If in AUTO mode, safely applies control decisions to DeviceService.
        """
        mode = AIAgentService.get_operating_mode()
        agent = AIAgentService.get_agent()

        decision = agent.process_cycle(reading_dict, mode=mode)

        # In AUTO mode, apply control decisions to the physical devices
        if mode == "AUTO":
            relays = DeviceService.get_relay_states()
            if decision["target_fan_relay"] != relays["fan"]:
                DeviceService.set_device_status("fan", "ON" if decision["target_fan_relay"] else "OFF")
            if decision["target_led_relay"] != relays["led"]:
                DeviceService.set_device_status("led", "ON" if decision["target_led_relay"] else "OFF")

        # Persist decision to DB
        session = SessionLocal()
        try:
            record = AIDecision(
                timestamp=datetime.now(timezone.utc),
                classification=decision["classification"],
                confidence=decision["confidence"],
                recommendation=decision["recommendation"],
                reason=decision["reason"],
                suggested_action=decision["suggested_action"],
                action_taken=decision["action_taken"],
                power_observed_mw=decision["power_observed_mw"]
            )
            session.add(record)
            session.commit()

            # Optional: Sync to Supabase
            sb = get_supabase()
            if sb:
                try:
                    sb.table("ai_decisions").insert({
                        "classification": decision["classification"],
                        "confidence": decision["confidence"],
                        "recommendation": decision["recommendation"],
                        "reason": decision["reason"],
                        "suggested_action": decision["suggested_action"],
                        "action_taken": decision["action_taken"],
                        "power_observed_mw": decision["power_observed_mw"]
                    }).execute()
                except Exception as e:
                    logger.warning("Failed to sync AI decision to Supabase: %s", e)

        except Exception as e:
            session.rollback()
            logger.error("Failed to store AI decision: %s", e)
        finally:
            session.close()

        return decision

    @staticmethod
    def get_recent_decisions(limit: int = 15) -> list:
        session = SessionLocal()
        try:
            records = session.query(AIDecision).order_by(AIDecision.id.desc()).limit(limit).all()
            return [r.to_dict() for r in records]
        finally:
            session.close()

    @staticmethod
    def get_ai_status() -> dict:
        agent = AIAgentService.get_agent()
        mode = AIAgentService.get_operating_mode()

        metadata_file = os.path.join(os.path.dirname(Config.AI_MODEL_PATH), "model_metadata.json")
        metadata = {}
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r") as f:
                    metadata = json.load(f)
            except Exception:
                pass

        return {
            "model_loaded": agent.model is not None,
            "model_type": metadata.get("model_type", "RuleBasedFallback" if agent.model is None else "RandomForestClassifier"),
            "classes": agent.classes_ if agent.classes_ else ["ABNORMAL", "HIGH_CONSUMPTION", "IDLE", "NORMAL"],
            "accuracy": metadata.get("accuracy", 1.0 if agent.model is not None else None),
            "operating_mode": mode,
            "trained_at": metadata.get("trained_at", None),
            "is_synthetic_demonstration": metadata.get("is_synthetic_demonstration", True),
            "notes": metadata.get("notes", "Model trained on synthetic demonstration data. Retrain with real INA219 readings when available.")
        }
