# STEP-BY-STEP TESTING PROCEDURE
## Smart Power Optimization System Using AI Agents

Follow these 9 sequential stages strictly. Never proceed to the next stage until the current stage's verification test passes.

---

### STAGE 1: ESP32 Core Setup & USB Communication
- **Goal:** Verify Arduino IDE, CP2102/CH340 USB driver, and ESP32 board flashing.
- **Steps:**
  1. Open Arduino IDE. Go to **File → Preferences**.
  2. Add ESP32 package URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
  3. Go to **Tools → Board → Boards Manager**, search `esp32` by Espressif and click **Install**.
  4. Select **Tools → Board → ESP32 Arduino → ESP32 Dev Module**.
  5. Plug in ESP32 via Micro-USB. Select the detected **COM Port** (e.g. `COM3` or `COM4`).
  6. Open **File → Examples → 01.Basics → Blink**.
  7. Change LED pin to `2` (ESP32 onboard LED is GPIO 2) and click **Upload**.
- **Verification:** Onboard blue LED flashes at 1-second intervals. Serial Monitor at 115200 baud outputs successfully.

---

### STAGE 2: INA219 #1 (Fan Sensor) I2C Address Verification
- **Goal:** Confirm INA219 #1 is detected at `0x40`.
- **Wiring (No loads yet):**
  - ESP32 3.3V → INA219 VCC
  - ESP32 GND → INA219 GND
  - ESP32 GPIO 21 → INA219 SDA
  - ESP32 GPIO 22 → INA219 SCL
- **Test Sketch:** Upload an I2C scanner sketch (found in Arduino IDE: File → Examples → Wire → i2c_scanner).
- **Verification:** Serial monitor reports: `I2C device found at address 0x40 !`.

---

### STAGE 3: INA219 #2 (LED Sensor) Address Customization
- **Goal:** Confirm the second INA219 is detected at `0x41` on the same I2C bus.
- **Modification:**
  - Locate solder jumper pad labeled `A0` on the second INA219 breakout.
  - Bridge the two pads of `A0` with a soldering iron and a tiny drop of solder.
- **Wiring:**
  - Connect INA219 #2 VCC to 3.3V, GND to GND, SDA to GPIO 21, SCL to GPIO 22 (in parallel with sensor #1).
- **Verification:** Run the I2C scanner again. Serial monitor must report **both**:
  - `I2C device found at address 0x40 !` (Sensor 1 - Fan)
  - `I2C device found at address 0x41 !` (Sensor 2 - LED)

---

### STAGE 4: 2-Channel Relay Module Safe Actuation Test
- **Goal:** Verify relay switching and active-LOW behavior with **NO LOADS CONNECTED**.
- **Wiring:**
  - ESP32 VIN (5V) → Relay VCC
  - ESP32 GND → Relay GND
  - ESP32 GPIO 25 → Relay IN1
  - ESP32 GPIO 26 → Relay IN2
- **Test:** Upload a simple toggle script that sets GPIO 25 LOW for 2s, then HIGH for 2s.
- **Verification:**
  - Notice the audible "click" when the relay triggers.
  - Verify that when GPIO is `HIGH`, the relay is OFF (LED unlit).
  - Verify that upon ESP32 power-on / reset, the relays stay completely OFF without clicking.

---

### STAGE 5: LM2596 DC-DC Buck Converter Multimeter Calibration
- **CRITICAL STEP:** Never connect the 5V COB LED without completing this step.
- **Tools Needed:** Digital Multimeter set to DC Voltage (20V scale).
- **Procedure:**
  1. Connect 12V DC Adapter (+) to LM2596 `IN+`.
  2. Connect 12V DC Adapter (−) to LM2596 `IN−`.
  3. Power on the 12V adapter.
  4. Place multimeter probes across LM2596 `OUT+` (red probe) and `OUT−` (black probe).
  5. The factory setting might read 10V–11V.
  6. Turn the small brass screw on the blue potentiometer counter-clockwise (approximately 8 to 15 turns) until the multimeter display steadily reads **5.00V ± 0.05V**.
- **Verification:** Multimeter firmly shows 5.00V. Turn 12V power off before proceeding.

---

### STAGE 6: Physical Load Integration & Bench Testing
- **Procedure:**
  1. Connect Fan branch: 12V (+) → Fuse → INA219 #1 VIN+ → INA219 #1 VIN− → Relay 1 COM → Relay 1 NO → Fan (+). Fan (−) → 12V (−).
  2. Connect LED branch: LM2596 5.0V OUT+ → INA219 #2 VIN+ → INA219 #2 VIN− → Relay 2 COM → Relay 2 NO → COB LED (+). LED (−) → LM2596 OUT−.
  3. Turn on 12V power adapter.
  4. Manually trigger Relay 1: Fan spins; INA219 #1 reads ~12V, 200–350mA, 2.4W–4.2W.
  5. Manually trigger Relay 2: COB LED illuminates cleanly; INA219 #2 reads ~5.0V, 300–600mA, 1.5W–3.0W.
- **Verification:** Current and power readings match nominal expectations without excessive heating.

---

### STAGE 7: Backend API Verification
- **Goal:** Verify Python Flask REST API and AI engine locally.
- **Command:**
  ```powershell
  # In backend folder
  backend\venv\Scripts\python app.py
  ```
- **Verification:**
  1. Open browser to `http://localhost:5000/api/health`.
  2. Check response: `{"status": "healthy", "service": "Smart Power Optimization Backend"}`.
  3. Run backend unit tests: `backend\venv\Scripts\pytest backend\app\tests -v` (All 10 tests PASS).

---

### STAGE 8: Frontend Dashboard Telemetry Verification
- **Command:**
  ```powershell
  # In frontend folder
  npm run dev
  ```
- **Verification:**
  1. Open `http://localhost:3000`.
  2. The modern AetherGrid tactical dashboard appears with live gauges and charts.
  3. Click the **Fan** and **LED** toggle buttons: verify that commands dispatch to the backend and relay states update.
  4. Run `python scripts/simulate_esp32.py` in a terminal: verify that live readings stream into the graphs every 2 seconds and the simulation badge illuminates.

---

### STAGE 9: Full End-to-End System Integration & AI Validation
- **Steps:**
  1. In `esp32/firmware/config.h`, set your home/hotspot Wi-Fi SSID, password, and your laptop's local IP address (from `ipconfig`).
  2. Flash `esp32/firmware/energy_agent.ino` to the ESP32.
  3. Open Serial Monitor at 115200 baud.
  4. Verify the ESP32 connects to Wi-Fi and begins outputting: `[HTTP 200] Telemetry delivered`.
  5. Look at the React dashboard: **ESP32 ONLINE** status pip turns bright emerald!
  6. Switch Mode to **AUTO**: test AI agent autonomous load management.
  7. Toggle loads, verify real-time graphs, and observe recorded decisions in the AI log table.

