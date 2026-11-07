from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Reading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Fan sensor readings (INA219 #1 @ 0x40)
    fan_voltage = Column(Float, nullable=False, default=0.0)
    fan_current_ma = Column(Float, nullable=False, default=0.0)
    fan_power_mw = Column(Float, nullable=False, default=0.0)
    
    # LED sensor readings (INA219 #2 @ 0x41)
    led_voltage = Column(Float, nullable=False, default=0.0)
    led_current_ma = Column(Float, nullable=False, default=0.0)
    led_power_mw = Column(Float, nullable=False, default=0.0)
    
    # Combined calculations
    total_power_mw = Column(Float, nullable=False, default=0.0)
    
    # Relay status at time of measurement
    fan_relay_state = Column(Boolean, nullable=False, default=False)
    led_relay_state = Column(Boolean, nullable=False, default=False)
    
    # Telemetry source flag
    is_simulated = Column(Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "fan": {
                "voltage": round(self.fan_voltage, 2),
                "current_ma": round(self.fan_current_ma, 2),
                "power_mw": round(self.fan_power_mw, 2),
                "relay_on": self.fan_relay_state
            },
            "led": {
                "voltage": round(self.led_voltage, 2),
                "current_ma": round(self.led_current_ma, 2),
                "power_mw": round(self.led_power_mw, 2),
                "relay_on": self.led_relay_state
            },
            "total_power_mw": round(self.total_power_mw, 2),
            "is_simulated": self.is_simulated
        }


class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String(50), primary_key=True)  # 'fan' or 'led'
    name = Column(String(100), nullable=False)
    voltage_rating = Column(String(20), nullable=False)
    relay_pin = Column(Integer, nullable=False)
    status = Column(String(10), nullable=False, default="OFF")  # 'ON' or 'OFF'
    is_active = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "device_id": self.device_id,
            "name": self.name,
            "voltage_rating": self.voltage_rating,
            "relay_pin": self.relay_pin,
            "status": self.status,
            "is_active": self.is_active,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class AIDecision(Base):
    __tablename__ = "ai_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    classification = Column(String(50), nullable=False)  # NORMAL, IDLE, HIGH_CONSUMPTION, ABNORMAL
    confidence = Column(Float, nullable=False, default=100.0)
    recommendation = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    suggested_action = Column(String(50), nullable=False)
    action_taken = Column(String(50), nullable=False, default="MONITORED")
    power_observed_mw = Column(Float, nullable=False, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "classification": self.classification,
            "confidence": round(self.confidence, 1),
            "recommendation": self.recommendation,
            "reason": self.reason,
            "suggested_action": self.suggested_action,
            "action_taken": self.action_taken,
            "power_observed_mw": round(self.power_observed_mw, 2)
        }


class SystemSetting(Base):
    __tablename__ = "system_settings"

    setting_key = Column(String(100), primary_key=True)
    setting_value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

