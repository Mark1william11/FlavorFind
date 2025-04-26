# app/models.py
from . import db # Import the db instance from app/__init__.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users' # Explicitly name the table

    # Columns based on ERD
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False) # Increased length for stronger hashes
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationship (defines the 'recipes' attribute on User instances)
    # backref='author' adds an 'author' attribute to Recipe instances
    # lazy=True means SQLAlchemy will load the recipes only when accessed
    # cascade="all, delete-orphan" ensures recipes are deleted if user is deleted
    recipes = db.relationship('Recipe', backref='author', lazy=True, cascade="all, delete-orphan")

    # Method to set password securely
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Method to check password
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        # Helpful representation for debugging
        return f"<User {self.username}>"


class Recipe(db.Model):
    __tablename__ = 'recipes' # Explicitly name the table

    # Columns based on ERD
    recipe_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False) # Define Foreign Key relationship
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True) # Use Text for potentially long strings
    ingredients = db.Column(db.Text, nullable=False)
    instructions = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow) # Automatically updates

    def __repr__(self):
        # Helpful representation for debugging
        return f"<Recipe {self.title}>"