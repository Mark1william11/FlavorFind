# app/routes.py
from flask import Blueprint, render_template, session, redirect, url_for, flash
from .models import Recipe
from .forms import LoginForm, RegistrationForm, RecipeForm

# Create a Blueprint for main application routes (serving HTML pages)
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    # Renders templates/index.html
    return render_template('index.html', page_title="Home")

@main_bp.route('/login')
def login():
    # --- Add this check ---
    if 'user_id' in session:
        flash('You are already logged in.', 'info') # Optional feedback message
        return redirect(url_for('main.index')) # Redirect logged-in users away
    form = LoginForm() # Instantiate form
    # --- End check ---
    return render_template('login.html', page_title="Login", form=form)

@main_bp.route('/register')
def register():
    # --- Add this check ---
    if 'user_id' in session:
         flash('You are already logged in.', 'info') # Optional feedback message
         return redirect(url_for('main.index')) # Redirect logged-in users away
    form = RegistrationForm() # Instantiate form
    # --- End check ---
    return render_template('register.html', page_title="Register", form=form)

# Add placeholders for other pages - we'll need login protection later
@main_bp.route('/my-recipes')
def my_recipes():
    # Check if user_id is in session (meaning they are logged in)
    if 'user_id' not in session:
        # If not logged in, redirect to the login page
        return redirect(url_for('main.login'))

    # If logged in, render the my_recipes template
    # The actual data fetching will happen via JavaScript calling the API
    return render_template('my_recipes.html', page_title="My Recipes")

@main_bp.route('/recipe/new')
def new_recipe_form():
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    form = RecipeForm() # Instantiate form
    # Render the recipe form template
    # We pass 'recipe=None' to indicate it's for creating, not editing
    return render_template('recipe_form.html', page_title="Add Recipe", form=form, recipe=None)

@main_bp.route('/recipe/<int:recipe_id>')
def view_recipe(recipe_id):
    # Ensure user is logged in to view personal recipe details
    # (Our API already checks ownership, but this prevents non-logged-in access)
    if 'user_id' not in session:
        return redirect(url_for('main.login'))

    # Pass the recipe_id to the template. JS will fetch the data.
    return render_template('recipe_detail.html', recipe_id=recipe_id)

@main_bp.route('/recipe/<int:recipe_id>/edit')
def edit_recipe_form(recipe_id):
    if 'user_id' not in session:
        return redirect(url_for('main.login'))

    user_id = session['user_id']
    # Fetch the recipe by ID *and* ensure it belongs to the current user
    recipe_to_edit = Recipe.query.filter_by(recipe_id=recipe_id, user_id=user_id).first()

    if not recipe_to_edit:
        # If recipe doesn't exist or doesn't belong to user, show error (or redirect)
        # For simplicity, maybe redirect back to 'my_recipes' with a flash message later
        # For now, just render a simple error or redirect
        # from flask import abort
        # abort(404) # Or 403 Forbidden
        return redirect(url_for('main.my_recipes')) # Redirect if not found/authorized

    form = RecipeForm(obj=recipe_to_edit)
    # Render the same form template, but pass the recipe object
    return render_template('recipe_form.html',
                           page_title=f"Edit Recipe: {recipe_to_edit.title}",
                           form=form, # Pass form
                           recipe=recipe_to_edit) # Pass the recipe data