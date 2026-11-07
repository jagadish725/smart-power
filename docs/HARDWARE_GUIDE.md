# HARDWARE INTEGRATION & WIRING GUIDE
## Smart Power Optimization System Using AI Agents

This guide provides beginner-friendly, step-by-step instructions for wiring, power distribution, and safety verification for the final-year engineering prototype.

---

## 1. COMPONENT OVERVIEW & ROLES

| Component | Function in System | Voltage / Spec |
|---|---|---|
| **ESP32 DevKit V1 (30-pin)** | Main microcontroller. Reads I2C sensors, sends Wi-Fi telemetry to Python backend, executes relay commands. | Logic: 3.3V, Powered via Micro-USB (5V) |
| **INA219 Sensor #1** | High-side DC voltage and current monitor for **Load 1 (12V Fan)**. I2C Address: `0x40`. | Range: 0–26V, ±3.2A |
| **INA219 Sensor #2** | High-side DC voltage and current monitor for **Load 2 (5V COB LED)**. I2C Address: `0x41`. | Range: 0–26V, ±3.2A |
| **2-Channel 5V Relay Module** | Electromechanical switches isolating ESP32 logic from high-current DC loads. | Coils: 5V DC, Contacts: 10A 30V DC |
| **12V DC Power Adapter** | Primary DC power source for the entire physical load circuit. | 12V DC (Verify rating e.g. 2A / 3A on label) |
| **LM2596 DC-DC Buck Converter** | Steps down 12V DC to a precision-regulated 5.0V DC for the COB LED. | Input: 4.5–40V, Output: 1.25–35V Adj. |
| **12V DC Brushless Fan** | Load 1: Primary inductive load. | Rated 12V DC |
| **5V DC COB LED Module** | Load 2: Highly sensitive optical load. **Never connect directly to 12V!** | Rated 5V DC |
| **Inline DC Fuse Holder** | Overcurrent protection on the 12V positive rail. | Recommended 2A to 3A fast-blow fuse |

---

## 2. UNDERSTANDING PINOUTS & TERMINALS

### A. ESP32 DevKit V1 Pins
- **GPIO 21 (SDA):** I2C Data line connected to SDA on both INA219 modules.
- **GPIO 22 (SCL):** I2C Clock line connected to SCL on both INA219 modules.
- **GPIO 25:** Digital Output controlling Relay Channel 1 (12V Fan).
- **GPIO 26:** Digital Output controlling Relay Channel 2 (5V COB LED).
- **3.3V:** Sensor logic supply voltage (for INA219 VCC).
- **VIN (5V):** 5V DC power rail from USB or external regulator.
- **GND:** Logic common ground.

### B. INA219 Current & Voltage Sensor Pins
Each INA219 breakout board features two distinct sets of connections:
1. **Low-Voltage Logic Interface (Header Pins):**
   - `VCC`: Connect to ESP32 **3.3V** (or 5V if breakout supports it; 3.3V ensures I2C bus levels match ESP32).
   - `GND`: Connect to ESP32 **GND**.
   - `SDA`: Connect to ESP32 **GPIO 21**.
   - `SCL`: Connect to ESP32 **GPIO 22**.
2. **High-Current Power Measurement Terminals (Screw Terminal Block or VIN+/VIN-):**
   - `VIN+`: Connects to positive voltage source (supply side).
   - `VIN−`: Connects to the load positive (or relay COM).
   - *Note:* The INA219 measures current by reading the microscopic voltage drop across a 0.1Ω onboard shunt resistor between `VIN+` and `VIN−`. It MUST be connected in series with the positive line.

### C. INA219 I2C Address Configuration
Both INA219 sensors share the same two I2C wires (`GPIO 21 SDA` and `GPIO 22 SCL`). To avoid collisions, they must have unique addresses:
- **Sensor 1 (Fan): Address `0x40`** (Default: leave solder jumpers A0 and A1 unbridged/open).
- **Sensor 2 (LED): Address `0x41`** (Bridge solder pad **A0** using a small bead of solder to connect A0 to `V+` or bridge pads per breakout marking).

### D. Relay Terminals (COM, NO, NC)
Each relay channel has 3 screw terminals:
- **COM (Common):** The incoming switch terminal.
- **NO (Normally Open):** Disconnected from COM when relay is OFF; connects to COM when relay energizes. **We always use COM and NO** so loads remain OFF when unpowered.
- **NC (Normally Closed):** Connected to COM when relay is OFF. (Do NOT use NC for loads).

---

## 3. POWER TOPOLOGY & WIRING SCHEMATIC

```
                                [12V DC Adapter Positive]
                                           │
                                     [Inline Fuse]
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
             │                                                           │
   (Fan Branch - 12V)                                           (LED Branch - 5V)
             │                                                           │
   [INA219 #1 VIN+]                                             [LM2596 Buck IN+]
             │                                                           │
   [INA219 #1 VIN-]                                        [LM2596 Output calibrated to 5.0V]
             │                                                           │
   [Relay K1 COM]                                               [INA219 #2 VIN+]
             │                                                           │
   [Relay K1 NO]                                                [INA219 #2 VIN-]
             │                                                           │
    [12V Fan Positive]                                          [Relay K2 COM]
             │                                                           │
    [12V Fan Negative]                                          [Relay K2 NO]
             │                                                           │
             │                                                 [5V COB LED Positive]
             │                                                           │
             │                                                 [5V COB LED Negative]
             │                                                           │
             └─────────────────────────────┬─────────────────────────────┘
                                           │
                                [Common System Ground]
                                           │
                                [12V Adapter Negative]
```

---

## 4. PIN-TO-PIN CONNECTION TABLE

### Logic Connections (Low Current Jumpers)
| Source Pin | Destination Pin | Purpose | Wire Type |
|---|---|---|---|
| ESP32 3.3V | INA219 #1 VCC & INA219 #2 VCC | Sensor logic power | Dupont Female-to-Male |
| ESP32 GND | INA219 #1 GND & INA219 #2 GND | Sensor logic ground | Dupont Female-to-Male |
| ESP32 GPIO 21 | INA219 #1 SDA & INA219 #2 SDA | I2C Data bus | Dupont Female-to-Male |
| ESP32 GPIO 22 | INA219 #1 SCL & INA219 #2 SCL | I2C Clock bus | Dupont Female-to-Male |
| ESP32 GPIO 25 | Relay Module IN1 | Fan Relay trigger | Dupont Female-to-Female |
| ESP32 GPIO 26 | Relay Module IN2 | LED Relay trigger | Dupont Female-to-Female |
| ESP32 VIN (or 5V rail) | Relay Module VCC | Relay optocoupler power | Dupont Female-to-Female |
| ESP32 GND | Relay Module GND | Relay logic ground | Dupont Female-to-Female |

### Power Connections (High Current Path)
> **CRITICAL WARNING:** Do NOT route load current through the narrow metal tracks of a solderless breadboard. Breadboard rails are rated for <500mA. Use proper wire gauge (18–22 AWG) or direct screw terminal connections.

| From | To | Wire / Polarity |
|---|---|---|
| 12V Power Adapter (+) | Inline Fuse Holder Input | Red (12V Supply) |
| Fuse Holder Output | INA219 #1 Terminal `VIN+` AND LM2596 `IN+` | Red (Fused 12V) |
| INA219 #1 Terminal `VIN−` | Relay 1 (K1) Terminal `COM` | Red |
| Relay 1 (K1) Terminal `NO` | 12V Brushless Fan Red Wire (+) | Red |
| 12V Brushless Fan Black Wire (−) | 12V Power Adapter (−) Ground Rail | Black (Ground) |
| LM2596 `OUT+` (Calibrated 5.0V) | INA219 #2 Terminal `VIN+` | Red (5V Regulated) |
| INA219 #2 Terminal `VIN−` | Relay 2 (K2) Terminal `COM` | Red |
| Relay 2 (K2) Terminal `NO` | 5V COB LED Positive Pad/Wire (+) | Red |
| 5V COB LED Negative Pad/Wire (−) | LM2596 `OUT−` (Common Ground) | Black (Ground) |
| LM2596 `IN−` & `OUT−` | 12V Power Adapter (−) Ground Rail | Black (Ground) |

---

## 5. ESSENTIAL SAFETY & TESTING RULES

1. **The Multimeter Rule for LM2596:**
   - The LM2596 buck converter comes from the factory set to random voltages (often ~11V).
   - **DO NOT CONNECT THE COB LED YET.**
   - Connect 12V to `IN+` and `IN-`.
   - Take a digital multimeter in DC Volts mode and measure `OUT+` and `OUT-`.
   - Use a precision flathead screwdriver to turn the small brass screw on the blue potentiometer counter-clockwise until the multimeter reads **exactly 5.00V ± 0.05V**.
   - Only after this voltage is verified may you connect the 5V COB LED.

2. **Common Ground:**
   - The ESP32 ground, LM2596 negative rails, and 12V adapter negative must all share a clean electrical ground reference for sensors and relays to operate stably.

3. **Active-LOW Relay Default:**
   - Most 5V relay modules trigger when their input pin is pulled to **LOW** (0V).
   - Our firmware explicitly sets GPIO 25 and GPIO 26 to `HIGH` before defining them as outputs, ensuring neither load turns on accidentally when the ESP32 reboots.

