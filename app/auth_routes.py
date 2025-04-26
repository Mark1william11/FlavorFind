# app/auth_routes.py
from flask import Blueprint, request, jsonify, session
from .models import User
from . import db # Import db from app/__init__
from werkzeug.security import generate_password_hash, check_password_hash # Already in models, but good practice

# Create a Blueprint for authentication routes
# 'auth' is the name of the blueprint
# __name__ helps locate the blueprint
# url_prefix='/api/auth' means all routes in this blueprint will start with /api/auth
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    # Get data from the JSON payload of the POST request
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # --- Basic Validation ---
    if not username or not email or not password:
        return jsonify({"error": "Missing username, email, or password"}), 400

    # --- Check if user already exists ---
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409 # 409 Conflict
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    # --- Create new user ---
    new_user = User(username=username, email=email)
    new_user.set_password(password) # Hash the password

    # --- Add to database ---
    try:
        db.session.add(new_user)
        db.session.commit()
        # Don't return the password hash!
        return jsonify({
            "message": "User registered successfully!",
            "user": {
                "user_id": new_user.user_id,
                "username": new_user.username,
                "email": new_user.email
            }
        }), 201 # 201 Created
    except Exception as e:
        db.session.rollback() # Rollback in case of error
        return jsonify({"error": "Registration failed due to a server issue."}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    # Allow login via email or username (common practice)
    identifier = data.get('identifier') # Frontend should send 'identifier'
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"error": "Missing identifier or password"}), 400

    # Try finding user by email first, then by username
    user = User.query.filter_by(email=identifier).first()
    if not user:
        user = User.query.filter_by(username=identifier).first()

    # --- Validate user and password ---
    if user and user.check_password(password):
        # User authenticated successfully
        # Store user ID in session - this marks the user as logged in
        session.clear() # Clear previous session data
        session['user_id'] = user.user_id
        session['username'] = user.username # Store username too, might be useful

        return jsonify({
            "message": "Login successful!",
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email
            }
        }), 200 # 200 OK
    else:
        # Invalid credentials
        return jsonify({"error": "Invalid identifier or password"}), 401 # 401 Unauthorized


@auth_bp.route('/logout', methods=['POST']) # POST is often preferred for actions that change state (like logging out)
def logout():
    user_id = session.get('user_id')
    if user_id:
        # Clear the user session
        session.pop('user_id', None)
        session.pop('username', None)
        # session.clear() # Alternatively, clear everything
        return jsonify({"message": "Logout successful!"}), 200
    else:
         return jsonify({"error": "User not logged in"}), 401 # Or maybe 200 is fine too, idempotency

# Optional: Add a route to check current session status (useful for frontend)
@auth_bp.route('/status', methods=['GET'])
def status():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id) # Fetch user details based on ID in session
        if user:
             return jsonify({
                "logged_in": True,
                "user": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "email": user.email
                 }
             }), 200
        else: # User ID in session but not in DB? Clean up session.
             session.clear()
             return jsonify({"logged_in": False, "error": "Session invalid"}), 401
    else:
        return jsonify({"logged_in": False}), 200