# SYSTEM ARCHITECTURE & DATA FLOW
## Smart Power Optimization System Using AI Agents

---

## 1. END-TO-END SYSTEM TOPOLOGY

```mermaid
graph TD
    subgraph Physical_Plant["1. Physical Plant & Loads"]
        FAN["12V DC Brushless Fan"]
        LED["5V DC COB LED Module"]
        PWR["12V DC Power Supply"]
        BUCK["LM2596 Buck Converter (12V -> 5V)"]
        RELAY["2-Channel 5V Relay Module (K1 / K2)"]
    end

    subgraph Sensing_Layer["2. Sensing & Edge Controller"]
        SENS1["INA219 #1 (0x40 - Fan)"]
        SENS2["INA219 #2 (0x41 - LED)"]
        ESP32["ESP32 DevKit V1 (I2C & Wi-Fi)"]
    end

    subgraph Backend_Cloud["3. Backend API & Intelligence"]
        FLASK["Flask REST API Server (:5000)"]
        AI["AI Agent (Random Forest Engine)"]
        DB_LOCAL["SQLite Local DB (smart_power.db)"]
        DB_CLOUD["Supabase PostgreSQL Cloud DB"]
    end

    subgraph Presentation_Layer["4. User Interface"]
        DASH["React + Vite Tactical SCADA Dashboard (:3000)"]
    end

    PWR --> FAN
    PWR --> BUCK
    BUCK --> LED
    SENS1 -. Measures V & I .-> FAN
    SENS2 -. Measures V & I .-> LED
    SENS1 -->|I2C 0x40| ESP32
    SENS2 -->|I2C 0x41| ESP32
    ESP32 -->|GPIO 25 / 26| RELAY
    RELAY -->|Switches| FAN
    RELAY -->|Switches| LED

    ESP32 -->|HTTP POST /api/readings| FLASK
    FLASK --> AI
    AI -->|Classify & Decide| FLASK
    FLASK --> DB_LOCAL
    FLASK --> DB_CLOUD
    FLASK -->|HTTP Response: Relay Directives| ESP32

    DASH <-->|Polling / Control Actions| FLASK
```

---

## 2. CLOSED-LOOP AI AGENT WORKFLOW

```mermaid
stateDiagram-v2
    [*] --> OBSERVE: Sensor Ingestion
    OBSERVE --> ANALYSE: Extract V, I, P Features
    ANALYSE --> DECIDE: Run Random Forest Classifier
    
    state DECIDE {
        [*] --> CheckMode
        CheckMode --> AutoPolicy: Mode == AUTO
        CheckMode --> ManualAdvisory: Mode == MANUAL
        AutoPolicy --> CheckThresholds: Evaluate Safety Limits
        CheckThresholds --> NormalKeep: P < Budget
        CheckThresholds --> EmergencyTrip: Abnormal / Overcurrent
        CheckThresholds --> ShedLoad: High Consumption
    }

    DECIDE --> ACT: Formulate Action
    ACT --> VERIFY: Return Commands to ESP32
    VERIFY --> OBSERVE: Stream Next Sample
```

---

## 3. COMPONENT LAYERS

### Layer 1: Hardware & Sensing
- **INA219 Sensor 1 (`0x40`):** Samples 12V Fan voltage (0–26V) and current (mA) across an onboard 0.1Ω shunt resistor.
- **INA219 Sensor 2 (`0x41`):** Samples 5V COB LED voltage and current post-buck conversion.
- **Relay Module:** Optocoupled galvanic isolation between 3.3V ESP32 and high-current 12V/5V DC circuits.

### Layer 2: ESP32 Firmware
- Non-blocking telemetry loop posting every 2000ms.
- Reads JSON response from `/api/readings` and dynamically executes `commands.fan_relay` and `commands.led_relay`.
- Auto-reconnect watchdog for robust wireless communication.

### Layer 3: Backend REST Services
- Ingests telemetry, computes total power and cumulative energy (Wh / kWh) using trapezoidal integration.
- Orchestrates persistent dual-storage: writes locally to SQLite and syncs to Supabase Cloud when configured.

### Layer 4: AI Decision Engine
- 100-tree Random Forest Classifier trained on 9 operational features.
- Safe deterministic rule fallback if model file is missing or confidence is low.
- Generates transparent, explainable recommendations and rationales.

### Layer 5: SCADA Web Presentation
- Built with React, Vite, Tailwind CSS, Recharts, and Lucide icons.
- Displays live HUD metrics, real-time power charts, individual load actuator toggles, and autonomous AI decision logs.

