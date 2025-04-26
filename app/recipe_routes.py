# app/recipe_routes.py
from flask import Blueprint, request, jsonify, session
from .models import Recipe, User
from . import db
from functools import wraps # For creating decorators
import requests # Import the requests library
import os       # Import os to potentially get API key if needed (though TheMealDB v1 is free)

# Create a Blueprint for recipe routes
recipe_bp = Blueprint('recipes', __name__, url_prefix='/api/recipes')

# --- Decorator for Login Required ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if user_id is None:
            # If user_id is not in session, return Unauthorized
            return jsonify({"error": "Authentication required"}), 401
        # You could optionally add code here to check if the user_id in session
        # still corresponds to a valid user in the DB, but for simplicity we'll omit for now.
        return f(*args, **kwargs) # Otherwise, proceed with the original function
    return decorated_function

# --- API Routes ---

# Route to CREATE a new personal recipe
@recipe_bp.route('', methods=['POST']) # POST to /api/recipes
@login_required # Protect this route
def create_recipe():
    user_id = session.get('user_id') # We know user is logged in due to decorator
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    # Validate required fields
    title = data.get('title')
    ingredients = data.get('ingredients')
    instructions = data.get('instructions')
    if not title or not ingredients or not instructions:
        return jsonify({"error": "Missing required fields: title, ingredients, instructions"}), 400

    # Optional fields
    description = data.get('description')
    image_url = data.get('image_url')

    # Create new recipe instance
    new_recipe = Recipe(
        user_id=user_id,
        title=title,
        description=description,
        ingredients=ingredients,
        instructions=instructions,
        image_url=image_url
    )

    # Add to database
    try:
        db.session.add(new_recipe)
        db.session.commit()
        # Return the newly created recipe data (excluding user_id maybe)
        return jsonify({
            "message": "Recipe created successfully!",
            "recipe": {
                "recipe_id": new_recipe.recipe_id,
                "title": new_recipe.title,
                "description": new_recipe.description,
                "image_url": new_recipe.image_url,
                "created_at": new_recipe.created_at.isoformat(), # Use ISO format for consistency
                "updated_at": new_recipe.updated_at.isoformat()
            }
        }), 201 # 201 Created
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create recipe due to server issue."}), 500


# Route to READ all personal recipes for the logged-in user
@recipe_bp.route('', methods=['GET']) # GET /api/recipes
@login_required
def get_my_recipes():
    user_id = session.get('user_id')
    # Query the database for recipes belonging to this user
    user_recipes = Recipe.query.filter_by(user_id=user_id).order_by(Recipe.created_at.desc()).all()

    # Format the recipes for JSON response
    recipes_list = [{
        "recipe_id": recipe.recipe_id,
        "title": recipe.title,
        "description": recipe.description,
        "image_url": recipe.image_url,
        "created_at": recipe.created_at.isoformat(),
        "updated_at": recipe.updated_at.isoformat()
    } for recipe in user_recipes]

    return jsonify(recipes_list), 200


# Route to READ a specific personal recipe
@recipe_bp.route('/<int:recipe_id>', methods=['GET']) # GET /api/recipes/123
@login_required
def get_recipe_detail(recipe_id):
    user_id = session.get('user_id')
    # Find the recipe by its ID AND make sure it belongs to the logged-in user
    recipe = Recipe.query.filter_by(recipe_id=recipe_id, user_id=user_id).first()

    if recipe:
        # Return full details
        return jsonify({
            "recipe_id": recipe.recipe_id,
            "title": recipe.title,
            "description": recipe.description,
            "ingredients": recipe.ingredients,
            "instructions": recipe.instructions,
            "image_url": recipe.image_url,
            "created_at": recipe.created_at.isoformat(),
            "updated_at": recipe.updated_at.isoformat(),
            "author_username": recipe.author.username # Access related user via backref
        }), 200
    else:
        # Recipe not found OR doesn't belong to this user
        return jsonify({"error": "Recipe not found or access denied"}), 404 # 404 Not Found


# Route to UPDATE a specific personal recipe
@recipe_bp.route('/<int:recipe_id>', methods=['PUT']) # PUT /api/recipes/123
@login_required
def update_recipe(recipe_id):
    user_id = session.get('user_id')
    # Find the recipe by its ID AND ensure it belongs to the logged-in user
    recipe = Recipe.query.filter_by(recipe_id=recipe_id, user_id=user_id).first()

    if not recipe:
        return jsonify({"error": "Recipe not found or access denied"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    # Update fields if they are provided in the request data
    recipe.title = data.get('title', recipe.title) # Keep old value if not provided
    recipe.description = data.get('description', recipe.description)
    recipe.ingredients = data.get('ingredients', recipe.ingredients)
    recipe.instructions = data.get('instructions', recipe.instructions)
    recipe.image_url = data.get('image_url', recipe.image_url)

    # Validate mandatory fields weren't cleared (optional but good)
    if not recipe.title or not recipe.ingredients or not recipe.instructions:
         return jsonify({"error": "Mandatory fields cannot be empty"}), 400

    # Commit changes to the database
    try:
        db.session.commit()
        # Return updated recipe data
        return jsonify({
             "message": "Recipe updated successfully!",
             "recipe": {
                "recipe_id": recipe.recipe_id,
                "title": recipe.title,
                "description": recipe.description,
                "image_url": recipe.image_url,
                "created_at": recipe.created_at.isoformat(),
                "updated_at": recipe.updated_at.isoformat()
             }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update recipe due to server issue."}), 500


# Route to DELETE a specific personal recipe
@recipe_bp.route('/<int:recipe_id>', methods=['DELETE']) # DELETE /api/recipes/123
@login_required
def delete_recipe(recipe_id):
    user_id = session.get('user_id')
    # Find the recipe by its ID AND ensure it belongs to the logged-in user
    recipe = Recipe.query.filter_by(recipe_id=recipe_id, user_id=user_id).first()

    if not recipe:
        return jsonify({"error": "Recipe not found or access denied"}), 404

    # Delete from database
    try:
        db.session.delete(recipe)
        db.session.commit()
        return jsonify({"message": f"Recipe '{recipe.title}' deleted successfully!"}), 200 # Or 204 No Content
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete recipe due to server issue."}), 500
    
    
    # --- External Recipe Search Route ---

# Route to search recipes from TheMealDB API
# Note: This does NOT require login, so we don't use @login_required
# We'll put it under the '/api/recipes' prefix for grouping, maybe '/api/recipes/search'
@recipe_bp.route('/search', methods=['GET'])
def search_external_recipes():
    # Get search query parameters from the request URL
    # e.g., /api/recipes/search?query=chicken or /api/recipes/search?ingredient=garlic
    search_query = request.args.get('query')
    search_ingredient = request.args.get('ingredient')

    # --- Validate input ---
    if not search_query and not search_ingredient:
        return jsonify({"error": "Missing search query or ingredient parameter"}), 400

    # --- Construct TheMealDB API URL ---
    # Prioritize search by name if 'query' is provided
    if search_query:
        api_url = f"https://www.themealdb.com/api/json/v1/1/search.php?s={search_query}"
    else: # Otherwise search by ingredient
        api_url = f"https://www.themealdb.com/api/json/v1/1/filter.php?i={search_ingredient}"

    # --- Call TheMealDB API ---
    try:
        print(f"Calling TheMealDB API: {api_url}") # Log the API call
        response = requests.get(api_url, timeout=10) # Add a timeout
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json() # Parse the JSON response

        # --- Process and Return Results ---
        # TheMealDB returns {'meals': null} if nothing found, or {'meals': [...]}
        meals = data.get('meals')
        if meals is None:
            return jsonify([]), 200 # Return empty list if no results found
        else:
            # If searching by ingredient, the result only contains name, image, id.
            # If searching by name, it contains more details, but we might want to standardize
            # For consistency, let's return a list of basic meal info
            # Frontend can call a separate lookup endpoint if more detail is needed per recipe
            simplified_meals = []
            for meal in meals:
                # Check if essential keys exist before accessing
                meal_id = meal.get('idMeal')
                meal_name = meal.get('strMeal')
                meal_thumb = meal.get('strMealThumb')
                if meal_id and meal_name and meal_thumb:
                     simplified_meals.append({
                        "id": meal_id,
                        "name": meal_name,
                        "image_url": meal_thumb
                    })

            return jsonify(simplified_meals), 200

    except requests.exceptions.RequestException as e:
        # Handle connection errors, timeouts, etc.
        return jsonify({"error": f"Failed to fetch recipes from external source: {e}"}), 503 # 503 Service Unavailable
    except Exception as e:
        # Handle other potential errors (e.g., JSON parsing)
        return jsonify({"error": "Failed to process external recipe data."}), 500

# Optional: Add a route to get full details for a specific external recipe ID
@recipe_bp.route('/external/<string:meal_id>', methods=['GET'])
def get_external_recipe_detail(meal_id):
    api_url = f"https://www.themealdb.com/api/json/v1/1/lookup.php?i={meal_id}"
    try:
        print(f"Calling TheMealDB API for details: {api_url}")
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        meal_details = data.get('meals')
        if meal_details and len(meal_details) > 0:
             # The API returns a list with one item for lookup by ID
             full_meal = meal_details[0]
             # You might want to parse/clean the ingredients/instructions here if needed
             # For simplicity, we return the raw structure for now
             return jsonify(full_meal), 200
        else:
             return jsonify({"error": "External recipe not found"}), 404

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch recipe details from external source: {e}"}), 503
    except Exception as e:
        return jsonify({"error": "Failed to process external recipe detail data."}), 500