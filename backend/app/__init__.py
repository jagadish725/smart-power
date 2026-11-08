import logging
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.database import init_db
from app.routes.api import api_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React frontend (allows all origins in development)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize local SQLite database schema & seeds (safe initialization)
    try:
        with app.app_context():
            init_db()
    except Exception as e:
        logger.warning("Database init failed or read-only filesystem (continuing): %s", e)

    # Register API blueprint
    app.register_blueprint(api_bp)

    @app.route("/")
    def root():
        return jsonify({
            "status": "healthy",
            "service": "Smart Power Optimization Backend",
            "api_prefix": "/api"
        }), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"status": "error", "message": "Endpoint not found."}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"status": "error", "message": "Internal server error occurred."}), 500

    logger.info("Smart Power Optimization Flask Application Initialized.")
    return app

