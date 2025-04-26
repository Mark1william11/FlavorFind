# run.py
from app import create_app # Import the factory function

# Create an instance of the Flask application using the factory
app = create_app()

# This allows running the app directly using 'python run.py'
if __name__ == '__main__':
    # Use debug=True for development (shows errors, auto-reloads)
    # In production, use a proper WSGI server like Gunicorn/Waitress
    # Host='0.0.0.0' makes it accessible on your network (optional)
    app.run(debug=True, host='0.0.0.0')