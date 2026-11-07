"""
Model Training Script for Smart Power Optimization
===================================================
Trains a Random Forest Classifier to detect load states:
- NORMAL
- IDLE
- HIGH_CONSUMPTION
- ABNORMAL

Clear disclosure: The baseline model is trained using synthetic demonstration data.
When real sensor measurements are collected from ESP32 INA219 modules,
this script can be executed with actual CSV logs to retrain the production model.
"""

import os
import json
import joblib
import pandas as pd
from datetime import datetime, timezone
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

from dataset_generator import generate_synthetic_dataset

FEATURE_COLUMNS = [
    "fan_voltage",
    "fan_current_ma",
    "fan_power_mw",
    "fan_relay",
    "led_voltage",
    "led_current_ma",
    "led_power_mw",
    "led_relay",
    "total_power_mw"
]

TARGET_COLUMN = "label"

def train_power_model(csv_path: str = None, save_dir: str = None):
    if save_dir is None:
        save_dir = os.path.dirname(os.path.abspath(__file__))
    
    if csv_path is None or not os.path.exists(csv_path):
        csv_path = os.path.join(save_dir, "synthetic_power_data.csv")
        if not os.path.exists(csv_path):
            print("Generating synthetic dataset for initial training...")
            df = generate_synthetic_dataset(num_samples=2500)
            df.to_csv(csv_path, index=False)
        else:
            print(f"Loading existing training dataset from {csv_path}...")
            df = pd.read_csv(csv_path)
    else:
        print(f"Loading custom training dataset from {csv_path}...")
        df = pd.read_csv(csv_path)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"\nModel Training Complete! Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, y_pred))

    # Save model artifact
    model_output_path = os.path.join(save_dir, "power_optimizer_model.joblib")
    joblib.dump(model, model_output_path)
    print(f"Saved trained model to: {model_output_path}")

    # Save metadata
    metadata = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "features": FEATURE_COLUMNS,
        "classes": list(model.classes_),
        "accuracy": round(float(acc), 4),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "is_synthetic_demonstration": True,
        "training_data_source": os.path.basename(csv_path),
        "notes": "Model trained on synthetic demonstration data. Retrain with real INA219 readings when available."
    }

    metadata_path = os.path.join(save_dir, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to: {metadata_path}")

    return model, metadata

if __name__ == "__main__":
    train_power_model()

