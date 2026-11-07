# Smart Power Optimization System Using AI Agents
### Final-Year Engineering Prototype • IoT, Embedded Systems, Machine Learning & Full-Stack

A complete, production-grade IoT and Artificial Intelligence system that monitors, analyzes, and autonomously optimizes energy consumption across independent DC loads using multi-variable telemetry and Machine Learning.

---

## 🚀 Key Features

- **Dual Load Telemetry:** Measures voltage, current, and instantaneous power independently for:
  - **Load 1:** 12V DC Brushless Fan (via INA219 #1 @ `0x40`)
  - **Load 2:** 5V DC COB LED Module (via INA219 #2 @ `0x41` and LM2596 buck converter)
- **Closed-Loop AI Agent:** Implements the **Observe → Analyse → Decide → Act → Verify** paradigm:
  - Random Forest Classifier with 100 estimators (`NORMAL`, `IDLE`, `HIGH_CONSUMPTION`, `ABNORMAL`).
  - Explainable AI: Produces actionable recommendations and engineering rationales.
  - Fail-safe deterministic rule fallback when model is uninitialized.
- **Hardware Protection & Safety Policies:**
  - Active-LOW relay logic with safe default de-energized boot states.
  - Multi-tiered power thresholds (Fan: 6W, LED: 3.5W, Total Budget: 8.5W).
  - Emergency Killswitch on hardware and dashboard.
- **Dual-Mode Cloud/Local Database:**
  - Seamlessly integrates with **Supabase Cloud PostgreSQL** using `backend/database/supabase_schema.sql`.
  - Automatically falls back to **Local SQLite** if Supabase credentials are not yet entered.
- **Modern Tactical SCADA Dashboard:**
  - Built with **React 18**, **Vite**, **Tailwind CSS**, and **Recharts**.
  - Styled with the Stitch **AetherGrid Industrial Telemetry** design system.
  - Real-time power comparison graphs, device actuator toggles, and autonomous decision logs.
  - Prominent simulation badge when demonstration telemetry is active.

---

## 📁 Project Directory Structure

```
smart-power-optimization/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app factory, CORS & route registration
│   │   ├── config.py             # Environment configuration & safety thresholds
│   │   ├── database.py           # Dual database engine (Supabase + SQLite)
│   │   ├── models.py             # Database schemas (Readings, Devices, Decisions)
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── api.py            # 14 complete REST API endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── device_service.py # Relay pin management & validation
│   │   │   ├── power_service.py  # Telemetry ingestion & energy integration
│   │   │   └── ai_agent_service.py # Closed-loop AI agent orchestration
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── dataset_generator.py # Generates synthetic demonstration dataset
│   │   │   ├── train_model.py    # Trains Random Forest Classifier
│   │   │   ├── evaluate_model.py # Evaluates accuracy & confusion matrix
│   │   │   ├── model.py          # PowerOptimizerAgent inference class
│   │   │   ├── power_optimizer_model.joblib # Saved trained model
│   │   │   └── model_metadata.json # Training metadata & synthetic disclosure
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_api.py       # Comprehensive API unit tests
│   │       └── test_ai.py        # AI decision & safety unit tests
│   ├── database/
│   │   ├── init_db.py            # Local SQLite database initializer
│   │   └── supabase_schema.sql   # SQL schema for Supabase SQL Editor
│   ├── app.py                    # Main Flask entrypoint (:5000)
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Template environment variables
│   └── .env                      # Local configuration file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top SCADA bar, mode toggle, killswitch
│   │   │   ├── OverviewDashboard.jsx # Real-time HUD gauges & simulation badge
│   │   │   ├── DeviceManagement.jsx  # Load actuator cards & manual toggles
│   │   │   ├── AIAgentPanel.jsx      # AI classifications, OODA workflow & logs
│   │   │   ├── AnalyticsCharts.jsx   # Live Recharts power & energy graphs
│   │   │   ├── SettingsModal.jsx     # Thresholds, Supabase & network settings
│   │   │   └── SystemStatusBar.jsx   # Hardware heartbeat & I2C status strip
│   │   ├── services/
│   │   │   └── api.js                # Axios client for backend REST API
│   │   ├── App.jsx                   # Main application state & polling loop
│   │   ├── main.jsx                  # React DOM root
│   │   └── index.css                 # Tailwind CSS & tactical styling
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.js                # Vite bundler & API proxy configuration
│   ├── tailwind.config.js            # Design tokens & color system
│   └── index.html                    # HTML shell
├── esp32/
│   └── firmware/
│       ├── energy_agent.ino          # Complete ESP32 Arduino firmware
│       ├── config.h                  # Local Wi-Fi & backend IP configuration
│       └── config.example.h          # Template configuration file
├── docs/
│   ├── PROJECT_OVERVIEW.md           # Engineering abstract & problem statement
│   ├── SYSTEM_ARCHITECTURE.md        # Architecture diagrams & data flow
│   ├── HARDWARE_GUIDE.md             # Pin-to-pin wiring, power topology & safety
│   ├── TESTING_GUIDE.md              # 9-stage sequential testing procedure
│   ├── API_DOCUMENTATION.md          # Complete REST API specifications & curls
│   └── INSTALLATION_GUIDE.md         # Detailed setup & dependency instructions
├── scripts/
│   ├── simulate_esp32.py             # Realistic hardware telemetry simulator
│   └── run_full_system.bat           # 1-click Windows system launcher
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start Instructions (Windows)

### 1. One-Click Launcher
Double-click `scripts/run_full_system.bat` from Windows File Explorer.  
It automatically starts the Flask API, launches the React dashboard, and opens `http://localhost:3000` in your browser!

---

### 2. Manual Step-by-Step Launch

#### Terminal 1: Backend
```powershell
cd "G:\jaggu pro"

# Initialize virtual environment and database
backend\venv\Scripts\python backend\database\init_db.py

# Launch Flask API server
backend\venv\Scripts\python backend\app.py
```
> Backend runs at `http://localhost:5000`

#### Terminal 2: Frontend
```powershell
cd "G:\jaggu pro\frontend"

# Launch React Vite development server
npm run dev
```
> Open `http://localhost:3000` in your browser

#### Terminal 3: Hardware Simulator (Optional)
```powershell
cd "G:\jaggu pro"

# Stream simulated INA219 readings to dashboard
backend\venv\Scripts\python scripts\simulate_esp32.py
```

---

## 🧪 Automated Testing

Verify backend and AI components:
```powershell
cd "G:\jaggu pro"
backend\venv\Scripts\pytest backend\app\tests -v
```
**Results:** 10/10 automated tests passing (API endpoints, relay control, mode switching, telemetry ingestion, AI classifications, emergency auto-shutdown).

---

## 🔌 Hardware Assembly & Testing

Refer to [docs/HARDWARE_GUIDE.md](file:///G:/jaggu%20pro/docs/HARDWARE_GUIDE.md) and [docs/TESTING_GUIDE.md](file:///G:/jaggu%20pro/docs/TESTING_GUIDE.md) for step-by-step guidance.

> **CRITICAL REMINDERS:**
> 1. **5V COB LED Protection:** Never connect the COB LED to 12V. You must adjust the LM2596 buck converter with a digital multimeter to **5.00V** before attaching the LED.
> 2. **Solderless Breadboard:** Do NOT route load current through breadboard rails. Use direct screw terminal wiring or 18–22 AWG wire.
> 3. **INA219 Addresses:** Fan sensor is at default `0x40`. LED sensor must have solder pad `A0` bridged to set it to `0x41`.

