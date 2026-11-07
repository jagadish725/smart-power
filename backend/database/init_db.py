import sys
import os

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import init_db, get_supabase
from app.config import Config

def main():
    print("=" * 60)
    print("Smart Power Optimization System - Database Initialization")
    print("=" * 60)
    
    print(f"[1/2] Initializing local SQLite database at: {Config.DATABASE_PATH}...")
    init_db()
    print("      -> SQLite database initialized successfully.")

    print(f"[2/2] Checking Supabase connection status...")
    if Config.SUPABASE_URL and Config.SUPABASE_KEY:
        sb = get_supabase()
        if sb:
            print(f"      -> Connected to Supabase at: {Config.SUPABASE_URL}")
            print("      -> Tip: Run 'database/supabase_schema.sql' in the Supabase SQL editor.")
        else:
            print("      -> Supabase credentials were provided, but connection failed.")
    else:
        print("      -> SUPABASE_URL not configured in .env.")
        print("      -> The system will run normally using the local SQLite database.")
        print("      -> Whenever you're ready, add your SUPABASE_URL and SUPABASE_KEY to .env!")
        
    print("=" * 60)
    print("Database initialization complete.")
    print("=" * 60)

if __name__ == "__main__":
    main()

