# REST API DOCUMENTATION
## Smart Power Optimization System Using AI Agents

Base URL: `http://localhost:5000/api` (or `http://<YOUR_LAPTOP_IP>:5000/api`)

---

### 1. Health Check
`GET /api/health`
- **Description:** Verifies backend service status, database mode, and AI model availability.
- **Example Curl:**
  ```bash
  curl -X GET http://localhost:5000/api/health
  ```
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "Smart Power Optimization Backend",
    "database": {
      "type": "Local SQLite",
      "supabase_configured": false,
      "supabase_connected": false
    },
    "ai_model": {
      "loaded": true,
      "type": "RandomForestClassifier"
    },
    "system_mode": "MANUAL"
  }
  ```

---

### 2. Comprehensive Dashboard
`GET /api/dashboard`
- **Description:** Returns aggregate telemetry, device states, analytics metrics, and recent AI decisions in a single call for high-performance dashboard rendering.
- **Response:**
  ```json
  {
    "status": "success",
    "latest_reading": { ... },
    "devices": [ ... ],
    "analytics": { "total_energy_wh": 1.25, "peak_power_mw": 5200 },
    "ai": { "status": { ... }, "latest_decision": { ... } },
    "system": { "mode": "MANUAL", "supabase_connected": false }
  }
  ```

---

### 3. Ingest Sensor Readings (ESP32 Post Endpoint)
`POST /api/readings`
- **Description:** Ingests live telemetry from ESP32 or hardware simulator, triggers AI analysis loop, and returns current relay commands.
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "fan": {
      "voltage": 12.05,
      "current_ma": 240.0,
      "power_mw": 2892.0,
      "relay_on": true
    },
    "led": {
      "voltage": 4.98,
      "current_ma": 380.0,
      "power_mw": 1892.4,
      "relay_on": true
    },
    "is_simulated": false
  }
  ```
- **Response (HTTP 201):**
  ```json
  {
    "status": "success",
    "reading_id": 42,
    "commands": {
      "fan_relay": true,
      "led_relay": true
    },
    "ai_classification": "NORMAL",
    "ai_confidence": 98.4,
    "mode": "MANUAL"
  }
  ```

---

### 4. Latest Reading
`GET /api/readings/latest`
- **Description:** Returns the most recent INA219 telemetry snapshot.

---

### 5. Historical Readings
`GET /api/readings/history?limit=50`
- **Description:** Returns an array of historical telemetry entries sorted chronologically ascending for Recharts graphs.
- **Query Parameters:** `limit` (int, default: 50, max: 500)

---

### 6. Device List
`GET /api/devices`
- **Description:** Returns all registered loads (`fan` and `led`) and their hardware attributes.

---

### 7. Device Relay Status
`GET /api/devices/status`
- **Description:** Returns boolean relay states `{ "fan": true/false, "led": true/false }`.

---

### 8. Device Relay Control
`POST /api/devices/control`
- **Description:** Actuates a load via relay.
- **Request Body:**
  ```json
  {
    "device_id": "fan",
    "action": "ON"
  }
  ```
- **Allowed `device_id`:** `"fan"`, `"led"`
- **Allowed `action`:** `"ON"`, `"OFF"`, `"TOGGLE"`

---

### 9. Operating Mode (GET / POST)
- `GET /api/mode`: Returns `{ "status": "success", "mode": "MANUAL" }`
- `POST /api/mode`:
  ```json
  {
    "mode": "AUTO"
  }
  ```
  *(Allowed: `"AUTO"`, `"MANUAL"`)*

---

### 10. AI Model Status
`GET /api/ai/status`
- **Description:** Returns active model type, number of classes, training accuracy, and synthetic data disclosure.

---

### 11. Run Telemetry Analysis
`POST /api/ai/analyze`
- **Description:** Evaluates telemetry payload through the AI classifier and returns classification, confidence, recommendation, and suggested action.

---

### 12. Recent AI Decisions Log
`GET /api/ai/decisions?limit=20`
- **Description:** Returns historical decision log records.

---

### 13. Analytics Summary
`GET /api/analytics/summary`
- **Description:** Returns integrated energy in Wh and kWh, peak system power, and active load count.

