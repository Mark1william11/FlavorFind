# app/__init__.py
from flask import Flask, session
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy # Import
from flask_migrate import Migrate       # Import
from flask_wtf.csrf import CSRFProtect

# Load environment variables from .env file
load_dotenv()

# Initialize extensions (outside the factory function)
db = SQLAlchemy()
migrate = Migrate()

csrf = CSRFProtect() # Initialize CSRFProtect instance

def create_app():
    """Application Factory Function"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a_default_fallback_secret_key')
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set.")
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app) # Initialize CSRF protection for the app

    # --- Context Processor ---
    # Makes session data available in all templates automatically
    @app.context_processor
    def inject_user_status():
        # is_logged_in = 'user_id' in session
        # username = session.get('username') # Get username if available
        # from flask_wtf.csrf import generate_csrf
        return dict(is_logged_in=('user_id' in session),
                     current_username=session.get('username')) # Pass the function itself

    # Import models AFTER db initialization
    from . import models

    # --- Register Blueprints ---
    from .auth_routes import auth_bp # Import the blueprint
    app.register_blueprint(auth_bp)   # Register it

    from .recipe_routes import recipe_bp # Import recipe blueprint
    app.register_blueprint(recipe_bp)    # Register recipe blueprint

    from .routes import main_bp        # Import main blueprint
    app.register_blueprint(main_bp)    # Register main blueprint

    # @app.route('/hello') # Keep this for basic testing if you like
    # def hello():
    #     return "<h1>Hello from the App Factory!</h1>"

    return app