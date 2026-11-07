# PROJECT OVERVIEW: SMART POWER OPTIMIZATION SYSTEM USING AI AGENTS

**Final Year Engineering Project (IoT, Embedded Systems, Machine Learning & Full-Stack)**

---

## 1. ABSTRACT

Modern industrial, commercial, and residential facilities face significant energy wastage due to unmonitored baseline loads, sub-optimal operating profiles, and sudden electrical anomalies. Traditional power meters measure bulk consumption at the utility entrance, offering zero visibility into individual device health or dynamic load behavior.

This project designs and implements an intelligent, closed-loop **Smart Power Optimization System Using AI Agents**. The system continuously monitors electrical parameters across two distinct DC loads:
1. **Load 1: 12V DC Brushless Fan** (Inductive thermal load)
2. **Load 2: 5V DC COB LED Module** (High-intensity optical load, stepped down via LM2596 buck converter)

Using two calibrated **INA219 high-side digital current/voltage sensors**, an **ESP32 microcontroller** samples bus voltage, current, and instantaneous power at high frequency over an I2C bus. The ESP32 streams this real-time telemetry over Wi-Fi to a **Python Flask REST API** backed by **Supabase** (with local SQLite fallback).

An embedded **Machine Learning AI Agent (Random Forest Classifier)** processes the multi-variable telemetry stream using an **Observe → Analyse → Decide → Act → Verify** closed-loop workflow:
- Categorizes operating states into `NORMAL`, `IDLE`, `HIGH_CONSUMPTION`, or `ABNORMAL`.
- In **MANUAL mode**, provides engineering recommendations and explanations to the operator.
- In **AUTO mode**, autonomously acts upon relay actuators to shed non-essential loads or trigger emergency isolations when safety thresholds are breached.
- Real-time telemetry, energy accumulation (Wh / kWh), and device controls are visualized on a tactical, high-performance **React + Tailwind CSS SCADA dashboard**.

---

## 2. ENGINEERING HIGHLIGHTS

1. **Independent Dual Load Monitoring:** Unlike simple single-sensor setups, two INA219 modules reside on the same I2C bus (`0x40` and `0x41`), measuring voltage drops across independent high-side 0.1Ω shunt resistors.
2. **Precision Voltage Stepping:** Features a calibrated LM2596 DC-DC buck converter to step 12V DC down to 5.00V DC for the COB LED, avoiding thermal overload.
3. **Safety-First Relay Architecture:** Uses optocoupled relays configured with active-LOW safe default boot states to prevent spurious switching during resets.
4. **Machine Learning Pipeline:** Employs a Scikit-learn Random Forest model trained on structured multi-feature profiles with safe rule-based deterministic fallbacks.
5. **Full Cloud + Local Hybrid Storage:** Features seamless integration with Supabase Cloud Postgres for remote monitoring and local SQLite for offline resiliency.

