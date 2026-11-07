# INSTALLATION & QUICK-START GUIDE
## Smart Power Optimization System Using AI Agents

Follow these beginner-friendly, copy-and-paste commands to set up, configure, and launch the entire software and firmware system.

---

## 1. PREREQUISITES

Verify your machine has Python and Node.js installed:
```powershell
python --version   # Requires Python 3.10 or higher
node -v            # Requires Node.js v18 or higher
npm -v             # Requires npm v9 or higher
```

---

## 2. BACKEND SETUP (PYTHON & FLASK)

### Step 2.1: Open PowerShell / Terminal in Project Root
```powershell
cd "G:\jaggu pro"
```

### Step 2.2: Create and Activate Virtual Environment
```powershell
# Create virtual environment
python -m venv backend\venv

# Activate virtual environment on Windows:
backend\venv\Scripts\Activate.ps1
# (If using CMD instead of PowerShell: backend\venv\Scripts\activate.bat)
# (On macOS / Linux: source backend/venv/bin/activate)
```

### Step 2.3: Install Backend Python Dependencies
```powershell
backend\venv\Scripts\pip install -r backend\requirements.txt
```

### Step 2.4: Initialize Database
```powershell
backend\venv\Scripts\python backend\database\init_db.py
```

### Step 2.5: Train AI Model & Verify
```powershell
# Train the Random Forest Classifier
backend\venv\Scripts\python backend\app\ai\train_model.py

# Evaluate Model Accuracy & Confusion Matrix
backend\venv\Scripts\python backend\app\ai\evaluate_model.py
```

### Step 2.6: Run Backend Automated Tests
```powershell
backend\venv\Scripts\pytest backend\app\tests -v
```
*(All 10 tests will run and pass).*

### Step 2.7: Launch Flask REST API Server
```powershell
backend\venv\Scripts\python backend\app.py
```
> Server runs at `http://localhost:5000`. Leave this terminal open.

---

## 3. FRONTEND SETUP (REACT & VITE)

### Step 3.1: Open a Second Terminal
```powershell
cd "G:\jaggu pro\frontend"
```

### Step 3.2: Install NPM Dependencies
```powershell
npm install
```

### Step 3.3: Launch React Vite Development Server
```powershell
npm run dev
```
> Open your browser and navigate to: **`http://localhost:3000`**

---

## 4. SUPABASE CLOUD SETUP (OPTIONAL)

When you are ready to connect your Supabase database:
1. Log in to [Supabase](https://supabase.com) and create a project.
2. In the Supabase sidebar, click on **SQL Editor**.
3. Open `backend/database/supabase_schema.sql` from this project, copy the entire script, paste it into Supabase SQL Editor, and click **Run**.
4. In Supabase **Project Settings → API**, copy your **Project URL** and **anon public Key**.
5. Open `backend/.env` and paste:
   ```ini
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-public-key
   ```
6. Restart the Flask backend. It will automatically detect Supabase and stream all live readings, device states, and AI decisions to your cloud database!

---

## 5. HARDWARE SIMULATOR (TEST BEFORE PHYSICAL ESP32)

To test the complete closed-loop system before connecting physical hardware:
1. Open a **Third Terminal**:
```powershell
cd "G:\jaggu pro"
backend\venv\Scripts\python scripts\simulate_esp32.py
```
2. Look at the React dashboard at `http://localhost:3000`:
   - Live telemetry streams into the gauges and charts every 2 seconds.
   - Click the Fan or LED toggle buttons to see relay switching in real time!
   - Observe autonomous AI classifications and recommendations updating live.

---

## 6. ESP32 FIRMWARE CONFIGURATION & FLASHING

1. Install **Arduino IDE 2.x**.
2. Install the **ESP32** board support package in Boards Manager.
3. Install required library:
   - Open **Sketch → Include Library → Manage Libraries...**
   - Search `Adafruit INA219` by Adafruit and click **Install**.
4. Find your laptop's local IPv4 Address:
   - Open Command Prompt and type: `ipconfig`
   - Look for **IPv4 Address** (e.g. `192.168.1.15`).
5. Open `esp32/firmware/config.h`:
   - Set `WIFI_SSID` to your Wi-Fi name.
   - Set `WIFI_PASSWORD` to your Wi-Fi password.
   - Set `BACKEND_HOST` to your laptop's IPv4 address.
6. Connect the ESP32 to your PC via Micro-USB cable.
7. Select **Board: ESP32 Dev Module** and choose your **COM Port**.
8. Click **Upload** (Arrow button in Arduino IDE).
9. Open the Serial Monitor at **115200 baud** to view real-time debug output.

