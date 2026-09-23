import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from app.oauth import oauth
from app.routes.auth import auth_bp
from app.routes.health import health_bp
from app.routes.tasks import tasks_bp
from app.routes.users import users_bp


load_dotenv()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv(
        "FLASK_SECRET_KEY",
        "development-secret-key"
    )

    # OAuth/session configuration
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False

    CORS(
        app,
        supports_credentials=True,
        origins=[
            "http://localhost:3000",
        ],
    )

    oauth.init_app(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(users_bp)

    return app