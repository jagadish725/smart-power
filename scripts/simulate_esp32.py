"""
ESP32 Hardware Simulation Script
================================
Simulates an ESP32 sending realistic telemetry from 2x INA219 sensors:
- Sensor 1: 12V DC Brushless Fan
- Sensor 2: 5V DC COB LED Module
Listens for relay commands in API responses and responds to control directives.
Marks all telemetry with 'is_simulated: true' to ensure transparent demonstration.
"""

import time
import random
import requests

API_ENDPOINT = "http://localhost:5000/api/readings"

def run_simulation(interval_seconds: float = 2.0):
    print("=" * 65)
    print(" ESP32 HARDWARE TELEMETRY SIMULATOR ")
    print("=" * 65)
    print(f" Target API: {API_ENDPOINT}")
    print(f" Interval:   {interval_seconds} seconds")
    print(" Press Ctrl+C to terminate simulation.")
    print("=" * 65)

    fan_relay = False
    led_relay = False

    while True:
        try:
            # Simulate Fan measurements
            if fan_relay:
                fan_v = round(random.uniform(11.7, 12.3), 2)
                fan_i = round(random.uniform(210.0, 310.0), 1)  # 210-310mA
            else:
                fan_v = round(random.uniform(11.9, 12.2), 2)
                fan_i = round(random.uniform(0.0, 3.0), 1)     # Quiescent
            fan_p = round(fan_v * fan_i, 1)

            # Simulate LED measurements
            if led_relay:
                led_v = round(random.uniform(4.90, 5.08), 2)
                led_i = round(random.uniform(340.0, 480.0), 1)  # 340-480mA
            else:
                led_v = round(random.uniform(4.95, 5.05), 2)
                led_i = round(random.uniform(0.0, 2.0), 1)     # Quiescent
            led_p = round(led_v * led_i, 1)

            payload = {
                "fan": {
                    "voltage": fan_v,
                    "current_ma": fan_i,
                    "power_mw": fan_p,
                    "relay_on": fan_relay
                },
                "led": {
                    "voltage": led_v,
                    "current_ma": led_i,
                    "power_mw": led_p,
                    "relay_on": led_relay
                },
                "is_simulated": True
            }

            resp = requests.post(API_ENDPOINT, json=payload, timeout=3.0)
            if resp.status_code in (200, 201):
                data = resp.json()
                commands = data.get("commands", {})
                new_fan = commands.get("fan_relay", fan_relay)
                new_led = commands.get("led_relay", led_relay)

                if new_fan != fan_relay or new_led != led_relay:
                    print(f" [*] RELAY COMMAND RECEIVED: Fan={new_fan}, LED={new_led}")
                    fan_relay = new_fan
                    led_relay = new_led

                ai_class = data.get("ai_classification", "UNKNOWN")
                total_w = (fan_p + led_p) / 1000.0
                print(f"[Telemetry] Sent: Fan={fan_p:.0f}mW, LED={led_p:.0f}mW | Total={total_w:.2f}W | AI={ai_class} | Mode={data.get('mode')}")
            else:
                print(f"[!] Server returned status {resp.status_code}: {resp.text}")

        except requests.exceptions.ConnectionError:
            print("[x] Backend server not reachable. Ensure Flask app is running at http://localhost:5000")
        except Exception as e:
            print(f"[!] Error: {e}")

        time.sleep(interval_seconds)

if __name__ == "__main__":
    run_simulation()

