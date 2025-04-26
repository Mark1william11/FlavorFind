# FlavorFind - A Recipe Finder & Personal Cookbook

[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/Framework-Flask-blue.svg)](https://flask.palletsprojects.com/)
[![Database](https://img.shields.io/badge/Database-MySQL-orange.svg)](https://www.mysql.com/)
[![UI](https://img.shields.io/badge/UI-Bootstrap%205-purple.svg)](https://getbootstrap.com/)

## Overview

FlavorFind is a dynamic web application for searching external recipes (via TheMealDB) and managing a personal recipe collection (CRUD operations). Developed for the CSE 428 Data Engineering course.

**Live Demo:** [Link if deployed]
**GitHub Repo:** [Your GitHub Repo Link]

---

## Features

*   **External Recipe Search:** By name or ingredient (dynamic search-as-you-type via AJAX/XHR).
*   **External Recipe Details:** View full details in a modal popup.
*   **User Authentication:** Secure registration & login using Flask sessions.
*   **Personal Recipe Management:** Logged-in users can Create, Read, Update, and Delete their own recipes.
*   **Responsive UI:** Styled with Bootstrap 5.
*   **Database:** Uses MySQL for persistent storage.

**Bonus Features Implemented:**
*   [X] Real-world data (TheMealDB API)
*   [X] AJAX for dynamic search (XMLHttpRequest)
*   [ ] Hosting [*Update checkmark if deployed*]

---

## Tech Stack & Architecture

*   **Architecture:** Standard 3-Tier (Frontend -> Backend API -> Database).
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript, Bootstrap 5 (CDN). JS interacts with the backend via asynchronous requests (`XMLHttpRequest`, `fetch`) using **JSON**.
*   **Backend:** Python 3, Flask framework, organized with Blueprints.
*   **Database:** MySQL, accessed via SQLAlchemy ORM. Migrations handled by Flask-Migrate.
*   **Key Libraries:** Flask-SQLAlchemy, Flask-Migrate, Requests, Werkzeug (hashing), python-dotenv.

---

## Local Setup Instructions

**1. Prerequisites:**
*   Python 3.8+ (added to PATH)
*   MySQL Server (running, note root password)
*   Git

**2. Clone & Setup Env:**
```bash
git clone [Your GitHub Repo Link]
cd [project-folder-name]
# Create and activate virtual environment
python -m venv venv
# Windows: .\venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

**3. Database:**
Connect to MySQL as root.
Create the database: CREATE SCHEMA flavorfind_db;

**4. Environment Variables:**
*   Copy .env.example to .env.
*   Edit .env and set:
        SECRET_KEY: A long random string.
        DATABASE_URL: Your MySQL connection string (e.g., mysql+mysqlconnector://root:YOUR_PASSWORD@localhost:3306/flavorfind_db).

**5. Database Migration:**
Apply the schema to your database:
flask db upgrade

**6. Run:**
Start the Flask development server:
python run.py