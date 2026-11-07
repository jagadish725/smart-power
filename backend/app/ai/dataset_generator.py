"""
Synthetic Dataset Generator for Smart Power Optimization
=========================================================
NOTE: This dataset is SYNTHETIC DEMONSTRATION DATA generated using realistic physical
parameters for initial model training and pipeline verification.
Do not claim real energy savings or hardware validation until actual physical
measurements have been recorded from the INA219 sensors.
"""

import os
import numpy as np
import pandas as pd

def generate_synthetic_dataset(num_samples: int = 2000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    data = []

    samples_per_class = num_samples // 4

    # 1. IDLE STATE: Both devices OFF, or quiescent baseline
    for _ in range(samples_per_class):
        fan_state = 0
        led_state = 0
        # Minimal quiescent currents / noise
        fan_v = np.random.uniform(11.8, 12.3)
        fan_i = np.random.uniform(0.0, 5.0)  # <= 5mA quiescent
        fan_p = fan_v * fan_i

        led_v = np.random.uniform(4.9, 5.1)
        led_i = np.random.uniform(0.0, 3.0)  # <= 3mA quiescent
        led_p = led_v * led_i

        total_p = fan_p + led_p
        data.append({
            "fan_voltage": fan_v,
            "fan_current_ma": fan_i,
            "fan_power_mw": fan_p,
            "fan_relay": fan_state,
            "led_voltage": led_v,
            "led_current_ma": led_i,
            "led_power_mw": led_p,
            "led_relay": led_state,
            "total_power_mw": total_p,
            "label": "IDLE"
        })

    # 2. NORMAL STATE: Typical active operation within nominal ratings
    for _ in range(samples_per_class):
        # Either fan on, led on, or both on
        config = np.random.choice(["fan_only", "led_only", "both"])
        
        if config == "fan_only":
            fan_state = 1
            led_state = 0
            fan_v = np.random.uniform(11.6, 12.4)
            fan_i = np.random.uniform(180.0, 320.0)  # Nominal 12V fan current
            led_v = np.random.uniform(4.9, 5.1)
            led_i = np.random.uniform(0.0, 4.0)
        elif config == "led_only":
            fan_state = 0
            led_state = 1
            fan_v = np.random.uniform(11.8, 12.3)
            fan_i = np.random.uniform(0.0, 4.0)
            led_v = np.random.uniform(4.9, 5.1)
            led_i = np.random.uniform(300.0, 520.0)  # Nominal 5V COB LED current
        else: # both
            fan_state = 1
            led_state = 1
            fan_v = np.random.uniform(11.5, 12.3)
            fan_i = np.random.uniform(180.0, 320.0)
            led_v = np.random.uniform(4.85, 5.05)
            led_i = np.random.uniform(300.0, 500.0)

        fan_p = fan_v * fan_i
        led_p = led_v * led_i
        total_p = fan_p + led_p

        data.append({
            "fan_voltage": fan_v,
            "fan_current_ma": fan_i,
            "fan_power_mw": fan_p,
            "fan_relay": fan_state,
            "led_voltage": led_v,
            "led_current_ma": led_i,
            "led_power_mw": led_p,
            "led_relay": led_state,
            "total_power_mw": total_p,
            "label": "NORMAL"
        })

    # 3. HIGH_CONSUMPTION: Active loads operating near or slightly above upper operating limits
    for _ in range(samples_per_class):
        fan_state = 1
        led_state = 1
        # Heavy load scenario (e.g. fan high RPM + LED full thermal load)
        fan_v = np.random.uniform(11.4, 12.1)
        fan_i = np.random.uniform(360.0, 460.0)
        led_v = np.random.uniform(4.8, 5.0)
        led_i = np.random.uniform(550.0, 720.0)

        fan_p = fan_v * fan_i
        led_p = led_v * led_i
        total_p = fan_p + led_p

        data.append({
            "fan_voltage": fan_v,
            "fan_current_ma": fan_i,
            "fan_power_mw": fan_p,
            "fan_relay": fan_state,
            "led_voltage": led_v,
            "led_current_ma": led_i,
            "led_power_mw": led_p,
            "led_relay": led_state,
            "total_power_mw": total_p,
            "label": "HIGH_CONSUMPTION"
        })

    # 4. ABNORMAL STATE: Severe voltage drops, short circuit anomalies, or stall current
    for _ in range(samples_per_class):
        anomaly_type = np.random.choice(["voltage_sag", "fan_stall", "led_overcurrent"])
        fan_state = 1
        led_state = 1

        if anomaly_type == "voltage_sag":
            # 12V line heavily overloaded, dropping below 10.2V
            fan_v = np.random.uniform(8.5, 10.2)
            fan_i = np.random.uniform(450.0, 650.0)
            led_v = np.random.uniform(3.8, 4.4)
            led_i = np.random.uniform(350.0, 550.0)
        elif anomaly_type == "fan_stall":
            # Fan rotor blocked/stalled, drawing huge current
            fan_v = np.random.uniform(10.5, 11.4)
            fan_i = np.random.uniform(650.0, 1100.0)
            led_v = np.random.uniform(4.8, 5.0)
            led_i = np.random.uniform(300.0, 500.0)
        else:
            # LED short or thermal runaway
            fan_v = np.random.uniform(11.5, 12.2)
            fan_i = np.random.uniform(200.0, 300.0)
            led_v = np.random.uniform(4.2, 4.7)
            led_i = np.random.uniform(800.0, 1400.0)

        fan_p = fan_v * fan_i
        led_p = led_v * led_i
        total_p = fan_p + led_p

        data.append({
            "fan_voltage": fan_v,
            "fan_current_ma": fan_i,
            "fan_power_mw": fan_p,
            "fan_relay": fan_state,
            "led_voltage": led_v,
            "led_current_ma": led_i,
            "led_power_mw": led_p,
            "led_relay": led_state,
            "total_power_mw": total_p,
            "label": "ABNORMAL"
        })

    df = pd.DataFrame(data)
    # Shuffle dataframe
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "synthetic_power_data.csv")
    df = generate_synthetic_dataset(num_samples=2400)
    df.to_csv(out_path, index=False)
    print(f"Generated synthetic training dataset: {out_path} ({len(df)} samples)")
    print(df["label"].value_counts())

