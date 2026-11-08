import sys
import os

# Ensure backend directory is in python module search path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.config import Config

app = create_app()

if __name__ == "__main__":
    print("=" * 65)
    print(" SMART POWER OPTIMIZATION SYSTEM - FLASK REST API SERVER")
    print("=" * 65)
    print(f" * Server running on: http://{Config.HOST}:{Config.PORT}")
    print(f" * REST API prefix:   http://{Config.HOST}:{Config.PORT}/api")
    print(f" * Database Mode:     {'Supabase' if Config.SUPABASE_URL else 'Local SQLite'}")
    print(f" * Operating Mode:    MANUAL (Default)")
    print("=" * 65)
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG, use_reloader=False)

