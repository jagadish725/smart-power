import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from app.config import Config
from app.models import Base, Device, SystemSetting

logger = logging.getLogger(__name__)

# SQLAlchemy SQLite Setup
engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    connect_args={"check_same_thread": False} if "sqlite" in Config.SQLALCHEMY_DATABASE_URI else {}
)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

# Supabase Client Setup (Optional)
supabase_client = None

def get_supabase():
    global supabase_client
    if supabase_client is not None:
        return supabase_client
    
    if Config.SUPABASE_URL and Config.SUPABASE_KEY:
        try:
            from supabase import create_client, Client
            supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
            logger.info("Connected to Supabase successfully at %s", Config.SUPABASE_URL)
            return supabase_client
        except Exception as e:
            logger.warning("Failed to initialize Supabase client: %s. Falling back to SQLite.", e)
            return None
    return None

def init_db():
    """Initializes local SQLite database tables and seeds default records."""
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        # Seed Devices if not present
        if not session.query(Device).filter_by(device_id="fan").first():
            fan = Device(
                device_id="fan",
                name="12V DC Brushless Fan",
                voltage_rating="12V DC",
                relay_pin=25,
                status="OFF",
                is_active=False
            )
            session.add(fan)

        if not session.query(Device).filter_by(device_id="led").first():
            led = Device(
                device_id="led",
                name="12V DC LED Module",
                voltage_rating="12V DC",
                relay_pin=26,
                status="OFF",
                is_active=False
            )
            session.add(led)

        # Seed System Settings
        if not session.query(SystemSetting).filter_by(setting_key="operating_mode").first():
            mode = SystemSetting(
                setting_key="operating_mode",
                setting_value="MANUAL",
                description="System operating mode: AUTO or MANUAL"
            )
            session.add(mode)

        session.commit()
        logger.info("Local SQLite database initialized and seeded successfully.")
    except Exception as e:
        session.rollback()
        logger.error("Error initializing local database: %s", e)
    finally:
        session.close()

def get_db():
    """Provides a database session generator."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

