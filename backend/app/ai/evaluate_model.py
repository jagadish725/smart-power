"""
Model Evaluation Script
=======================
Evaluates the trained Random Forest power optimization model.
Computes accuracy, precision, recall, F1-score, and feature importance.
"""

import os
import json
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

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

def evaluate_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "power_optimizer_model.joblib")
    data_path = os.path.join(current_dir, "synthetic_power_data.csv")

    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}. Run train_model.py first.")
        return

    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}. Run dataset_generator.py first.")
        return

    model = joblib.load(model_path)
    df = pd.read_csv(data_path)

    X = df[FEATURE_COLUMNS]
    y = df["label"]

    y_pred = model.predict(X)
    report = classification_report(y, y_pred)
    cm = confusion_matrix(y, y_pred, labels=model.classes_)

    print("=" * 60)
    print("AI MODEL EVALUATION REPORT")
    print("=" * 60)
    print(f"Model: RandomForestClassifier")
    print(f"Classes: {list(model.classes_)}")
    print("\nClassification Metrics:")
    print(report)

    print("\nConfusion Matrix:")
    print("Labels order:", list(model.classes_))
    print(cm)

    print("\nFeature Importances:")
    importances = model.feature_importances_
    for feat, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True):
        print(f"  {feat:<18}: {imp * 100:.2f}%")
    print("=" * 60)

if __name__ == "__main__":
    evaluate_model()

