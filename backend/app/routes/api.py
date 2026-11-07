"""
REST API Routes
===============
Endpoints for ESP32 telemetry ingestion, relay device control,
AI agent analytics, and React dashboard data delivery.
"""

import logging
from flask import Blueprint, request, jsonify
from app.config import Config
from app.database import get_supabase
from app.services.device_service import DeviceService
from app.services.power_service import PowerService
from app.services.ai_agent_service import AIAgentService

logger = logging.getLogger(__name__)
api_bp = Blueprint("api", __name__, url_prefix="/api")

# 1. GET /api/health
@api_bp.route("/health", methods=["GET"])
def health_check():
    sb = get_supabase()
    ai_status = AIAgentService.get_ai_status()
    return jsonify({
        "status": "healthy",
        "service": "Smart Power Optimization Backend",
        "database": {
            "type": "Supabase" if sb is not None else "Local SQLite",
            "supabase_configured": bool(Config.SUPABASE_URL and Config.SUPABASE_KEY),
            "supabase_connected": sb is not None
        },
        "ai_model": {
            "loaded": ai_status["model_loaded"],
            "type": ai_status["model_type"]
        },
        "system_mode": ai_status["operating_mode"]
    }), 200

# 2. GET /api/dashboard
@api_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    latest_reading = PowerService.get_latest_reading()
    devices = DeviceService.get_all_devices()
    analytics = PowerService.get_analytics_summary()
    ai_status = AIAgentService.get_ai_status()
    recent_decisions = AIAgentService.get_recent_decisions(limit=5)
    sb = get_supabase()

    return jsonify({
        "status": "success",
        "latest_reading": latest_reading,
        "devices": devices,
        "analytics": analytics,
        "ai": {
            "status": ai_status,
            "latest_decision": recent_decisions[0] if recent_decisions else None,
            "recent_decisions": recent_decisions
        },
        "system": {
            "mode": ai_status["operating_mode"],
            "supabase_connected": sb is not None,
            "supabase_configured": bool(Config.SUPABASE_URL and Config.SUPABASE_KEY),
            "relay_active_low": Config.RELAY_ACTIVE_LOW
        }
    }), 200

# 3. GET /api/readings/latest
@api_bp.route("/readings/latest", methods=["GET"])
def get_latest_reading():
    reading = PowerService.get_latest_reading()
    return jsonify({
        "status": "success",
        "reading": reading
    }), 200

# 4. POST /api/readings (ESP32 sends sensor telemetry here)
@api_bp.route("/readings", methods=["POST"])
def post_reading():
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"status": "error", "message": "Invalid JSON body or missing Content-Type header."}), 400

    # Ensure fan and led sections are present
    if "fan" not in payload or "led" not in payload:
        return jsonify({
            "status": "error",
            "message": "Payload must contain both 'fan' and 'led' sensor reading objects."
        }), 400

    try:
        # Ingest reading into database
        reading = PowerService.ingest_reading(payload)

        # Run AI Observe -> Analyse -> Decide cycle
        ai_decision = AIAgentService.evaluate_and_decide(reading)

        # Retrieve current desired relay commands to return to ESP32
        relays = DeviceService.get_relay_states()
        mode = AIAgentService.get_operating_mode()

        return jsonify({
            "status": "success",
            "reading_id": reading["id"],
            "commands": {
                "fan_relay": relays["fan"],
                "led_relay": relays["led"]
            },
            "ai_classification": ai_decision["classification"],
            "ai_confidence": ai_decision["confidence"],
            "mode": mode
        }), 201

    except Exception as e:
        logger.error("Error processing telemetry reading: %s", e)
        return jsonify({"status": "error", "message": str(e)}), 500

# 5. GET /api/readings/history
@api_bp.route("/readings/history", methods=["GET"])
def get_reading_history():
    limit = request.args.get("limit", default=50, type=int)
    limit = max(1, min(limit, 500))  # Cap between 1 and 500
    readings = PowerService.get_reading_history(limit=limit)
    return jsonify({
        "status": "success",
        "count": len(readings),
        "readings": readings
    }), 200

# 6. GET /api/devices
@api_bp.route("/devices", methods=["GET"])
def get_devices():
    devices = DeviceService.get_all_devices()
    return jsonify({
        "status": "success",
        "devices": devices
    }), 200

# 7. GET /api/devices/status
@api_bp.route("/devices/status", methods=["GET"])
def get_device_status():
    relays = DeviceService.get_relay_states()
    devices = DeviceService.get_all_devices()
    return jsonify({
        "status": "success",
        "relay_states": relays,
        "devices": devices
    }), 200

# 8. POST /api/devices/control
@api_bp.route("/devices/control", methods=["POST"])
def control_device():
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"status": "error", "message": "Missing JSON request body."}), 400

    device_id = payload.get("device_id")
    action = payload.get("action")

    if not device_id or not action:
        return jsonify({
            "status": "error",
            "message": "Both 'device_id' ('fan' or 'led') and 'action' ('ON', 'OFF', or 'TOGGLE') are required."
        }), 400

    try:
        updated_device = DeviceService.set_device_status(device_id, action)
        relays = DeviceService.get_relay_states()
        return jsonify({
            "status": "success",
            "message": f"Device '{device_id}' command '{action}' processed successfully.",
            "device": updated_device,
            "relay_states": relays
        }), 200
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        logger.error("Error controlling device: %s", e)
        return jsonify({"status": "error", "message": "Failed to update device state."}), 500

# 9. GET /api/mode
@api_bp.route("/mode", methods=["GET"])
def get_mode():
    mode = AIAgentService.get_operating_mode()
    return jsonify({
        "status": "success",
        "mode": mode
    }), 200

# 10. POST /api/mode
@api_bp.route("/mode", methods=["POST"])
def set_mode():
    payload = request.get_json(silent=True)
    if not payload or "mode" not in payload:
        return jsonify({"status": "error", "message": "Missing 'mode' parameter in JSON ('AUTO' or 'MANUAL')."}), 400

    try:
        new_mode = AIAgentService.set_operating_mode(payload["mode"])
        return jsonify({
            "status": "success",
            "message": f"Operating mode switched to {new_mode}.",
            "mode": new_mode
        }), 200
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# 11. GET /api/ai/status
@api_bp.route("/ai/status", methods=["GET"])
def get_ai_status():
    status = AIAgentService.get_ai_status()
    return jsonify({
        "status": "success",
        "ai_status": status
    }), 200

# 12. POST /api/ai/analyze
@api_bp.route("/ai/analyze", methods=["POST"])
def analyze_telemetry():
    payload = request.get_json(silent=True)
    if not payload:
        # If no body provided, analyze latest stored reading
        reading = PowerService.get_latest_reading()
    else:
        reading = payload

    mode = AIAgentService.get_operating_mode()
    agent = AIAgentService.get_agent()
    decision = agent.process_cycle(reading, mode=mode)

    return jsonify({
        "status": "success",
        "decision": decision
    }), 200

# 13. GET /api/ai/decisions
@api_bp.route("/ai/decisions", methods=["GET"])
def get_ai_decisions():
    limit = request.args.get("limit", default=20, type=int)
    limit = max(1, min(limit, 100))
    decisions = AIAgentService.get_recent_decisions(limit=limit)
    return jsonify({
        "status": "success",
        "count": len(decisions),
        "decisions": decisions
    }), 200

# 14. GET /api/analytics/summary
@api_bp.route("/analytics/summary", methods=["GET"])
def get_analytics():
    summary = PowerService.get_analytics_summary()
    return jsonify({
        "status": "success",
        "summary": summary
    }), 200

