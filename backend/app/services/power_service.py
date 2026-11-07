"""
Power Telemetry Service
=======================
Ingests INA219 sensor readings from ESP32, computes total power and
accumulated energy (Wh / kWh), and manages storage across SQLite and Supabase.
"""

import logging
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal, get_supabase
from app.models import Reading, Device

logger = logging.getLogger(__name__)

class PowerService:
    @staticmethod
    def ingest_reading(data: dict) -> dict:
        """
        Validates, calculates, and stores incoming telemetry from ESP32.
        Payload format:
        {
            "fan": { "voltage": float, "current_ma": float, "power_mw": float, "relay_on": bool },
            "led": { "voltage": float, "current_ma": float, "power_mw": float, "relay_on": bool },
            "is_simulated": bool (optional)
        }
        """
        fan_data = data.get("fan", {})
        led_data = data.get("led", {})

        fan_v = max(0.0, float(fan_data.get("voltage", 0.0)))
        fan_i = max(0.0, float(fan_data.get("current_ma", 0.0)))
        fan_p = max(0.0, float(fan_data.get("power_mw", fan_v * fan_i)))
        fan_relay = bool(fan_data.get("relay_on", False))

        led_v = max(0.0, float(led_data.get("voltage", 0.0)))
        led_i = max(0.0, float(led_data.get("current_ma", 0.0)))
        led_p = max(0.0, float(led_data.get("power_mw", led_v * led_i)))
        led_relay = bool(led_data.get("relay_on", False))

        total_p = fan_p + led_p
        is_simulated = bool(data.get("is_simulated", False))

        session = SessionLocal()
        try:
            reading = Reading(
                timestamp=datetime.now(timezone.utc),
                fan_voltage=fan_v,
                fan_current_ma=fan_i,
                fan_power_mw=fan_p,
                fan_relay_state=fan_relay,
                led_voltage=led_v,
                led_current_ma=led_i,
                led_power_mw=led_p,
                led_relay_state=led_relay,
                total_power_mw=total_p,
                is_simulated=is_simulated
            )
            session.add(reading)

            # Update active status in Device table based on live measurement
            fan_dev = session.query(Device).filter_by(device_id="fan").first()
            if fan_dev:
                fan_dev.is_active = fan_i > 15.0  # current > 15mA means load physically drawing power

            led_dev = session.query(Device).filter_by(device_id="led").first()
            if led_dev:
                led_dev.is_active = led_i > 15.0

            session.commit()
            reading_dict = reading.to_dict()

            # Optional: Sync to Supabase
            sb = get_supabase()
            if sb:
                try:
                    sb.table("sensor_readings").insert({
                        "fan_voltage": fan_v,
                        "fan_current_ma": fan_i,
                        "fan_power_mw": fan_p,
                        "led_voltage": led_v,
                        "led_current_ma": led_i,
                        "led_power_mw": led_p,
                        "total_power_mw": total_p,
                        "fan_relay_state": fan_relay,
                        "led_relay_state": led_relay,
                        "is_simulated": is_simulated
                    }).execute()
                except Exception as e:
                    logger.warning("Supabase sync failed: %s", e)

            return reading_dict
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    @staticmethod
    def get_latest_reading() -> dict:
        session = SessionLocal()
        try:
            reading = session.query(Reading).order_by(Reading.id.desc()).first()
            if reading:
                return reading.to_dict()
            return {
                "id": None,
                "timestamp": None,
                "fan": {"voltage": 0.0, "current_ma": 0.0, "power_mw": 0.0, "relay_on": False},
                "led": {"voltage": 0.0, "current_ma": 0.0, "power_mw": 0.0, "relay_on": False},
                "total_power_mw": 0.0,
                "is_simulated": False
            }
        finally:
            session.close()

    @staticmethod
    def get_reading_history(limit: int = 50) -> list:
        session = SessionLocal()
        try:
            readings = session.query(Reading).order_by(Reading.id.desc()).limit(limit).all()
            # Return chronologically ascending for charts
            return [r.to_dict() for r in reversed(readings)]
        finally:
            session.close()

    @staticmethod
    def get_analytics_summary() -> dict:
        session = SessionLocal()
        try:
            total_readings = session.query(Reading).count()
            if total_readings == 0:
                return {
                    "total_energy_wh": 0.0,
                    "total_energy_kwh": 0.0,
                    "peak_power_mw": 0.0,
                    "avg_power_mw": 0.0,
                    "active_devices_count": 0,
                    "readings_count": 0,
                    "fan_energy_wh": 0.0,
                    "led_energy_wh": 0.0
                }

            readings = session.query(Reading).order_by(Reading.id.asc()).all()

            # Integrate power over time (trapezoidal integration between samples)
            total_energy_mwh = 0.0
            fan_energy_mwh = 0.0
            led_energy_mwh = 0.0
            peak_power = 0.0
            sum_power = 0.0

            for i in range(len(readings)):
                r = readings[i]
                sum_power += r.total_power_mw
                if r.total_power_mw > peak_power:
                    peak_power = r.total_power_mw

                if i > 0:
                    prev = readings[i - 1]
                    # Calculate delta seconds between consecutive readings
                    dt_seconds = 2.0  # default interval
                    if r.timestamp and prev.timestamp:
                        diff = (r.timestamp - prev.timestamp).total_seconds()
                        if 0 < diff < 60:
                            dt_seconds = diff

                    dt_hours = dt_seconds / 3600.0
                    total_energy_mwh += ((r.total_power_mw + prev.total_power_mw) / 2.0) * dt_hours
                    fan_energy_mwh += ((r.fan_power_mw + prev.fan_power_mw) / 2.0) * dt_hours
                    led_energy_mwh += ((r.led_power_mw + prev.led_power_mw) / 2.0) * dt_hours

            avg_power = sum_power / total_readings

            # Active devices
            fan_active = readings[-1].fan_current_ma > 15.0 if readings else False
            led_active = readings[-1].led_current_ma > 15.0 if readings else False
            active_count = (1 if fan_active else 0) + (1 if led_active else 0)

            total_wh = total_energy_mwh / 1000.0
            return {
                "total_energy_wh": round(total_wh, 4),
                "total_energy_kwh": round(total_wh / 1000.0, 6),
                "fan_energy_wh": round(fan_energy_mwh / 1000.0, 4),
                "led_energy_wh": round(led_energy_mwh / 1000.0, 4),
                "peak_power_mw": round(peak_power, 2),
                "avg_power_mw": round(avg_power, 2),
                "active_devices_count": active_count,
                "readings_count": total_readings
            }
        finally:
            session.close()

