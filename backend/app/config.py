import os
from dotenv import load_dotenv

# Load .env file from backend root or parent
load_dotenv()

class Config:
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # Supabase Credentials
    SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

    # SQLite Database Fallback
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    DATABASE_PATH = os.path.join(BASE_DIR, "app", "smart_power.db")
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH}"

    # Relay settings
    RELAY_ACTIVE_LOW = os.getenv("RELAY_ACTIVE_LOW", "True").lower() in ("true", "1", "yes")

    # Power Safety Thresholds (Milliwatts)
    FAN_POWER_THRESHOLD_MW = float(os.getenv("FAN_POWER_THRESHOLD_MW", 6000.0))
    LED_POWER_THRESHOLD_MW = float(os.getenv("LED_POWER_THRESHOLD_MW", 3500.0))
    TOTAL_POWER_BUDGET_MW = float(os.getenv("TOTAL_POWER_BUDGET_MW", 8500.0))

    # AI Model Path
    AI_MODEL_PATH = os.path.join(BASE_DIR, "app", "ai", "power_optimizer_model.joblib")

