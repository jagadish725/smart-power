"""
Device Service
==============
Manages states, commands, and relay pin assignments for physical loads:
- Load 1: 12V DC Brushless Fan (GPIO 25)
- Load 2: 5V DC COB LED Module (GPIO 26)
"""

import logging
from datetime import datetime, timezone
from app.database import SessionLocal, get_supabase
from app.models import Device

logger = logging.getLogger(__name__)

VALID_DEVICES = ["fan", "led"]
VALID_ACTIONS = ["ON", "OFF", "TOGGLE"]

class DeviceService:
    @staticmethod
    def get_all_devices():
        session = SessionLocal()
        try:
            devices = session.query(Device).all()
            return [d.to_dict() for d in devices]
        finally:
            session.close()

    @staticmethod
    def get_device(device_id: str):
        if device_id not in VALID_DEVICES:
            return None
        session = SessionLocal()
        try:
            device = session.query(Device).filter_by(device_id=device_id).first()
            return device.to_dict() if device else None
        finally:
            session.close()

    @staticmethod
    def set_device_status(device_id: str, action: str):
        device_id = device_id.lower().strip()
        action = action.upper().strip()

        if device_id not in VALID_DEVICES:
            raise ValueError(f"Invalid device '{device_id}'. Allowed devices: {VALID_DEVICES}")

        if action not in VALID_ACTIONS:
            raise ValueError(f"Invalid action '{action}'. Allowed actions: {VALID_ACTIONS}")

        session = SessionLocal()
        try:
            device = session.query(Device).filter_by(device_id=device_id).first()
            if not device:
                raise ValueError(f"Device '{device_id}' not found in registry.")

            target_status = action
            if action == "TOGGLE":
                target_status = "OFF" if device.status == "ON" else "ON"

            device.status = target_status
            device.is_active = (target_status == "ON")
            device.updated_at = datetime.now(timezone.utc)
            session.commit()

            # Optional: Sync to Supabase if connected
            sb = get_supabase()
            if sb:
                try:
                    sb.table("devices").update({
                        "status": device.status,
                        "is_active": device.is_active,
                        "updated_at": device.updated_at.isoformat()
                    }).eq("device_id", device_id).execute()
                except Exception as e:
                    logger.warning("Failed to sync device status to Supabase: %s", e)

            return device.to_dict()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    @staticmethod
    def get_relay_states():
        """Returns boolean relay states: { 'fan': bool, 'led': bool }"""
        session = SessionLocal()
        try:
            fan = session.query(Device).filter_by(device_id="fan").first()
            led = session.query(Device).filter_by(device_id="led").first()
            return {
                "fan": fan.status == "ON" if fan else False,
                "led": led.status == "ON" if led else False
            }
        finally:
            session.close()

