# app/forms.py
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, URLField
from wtforms.validators import DataRequired, Email, EqualTo, Optional, Length

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=50)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

class LoginForm(FlaskForm):
    # Use 'identifier' to accept email or username
    identifier = StringField('Username or Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class RecipeForm(FlaskForm):
    title = StringField('Recipe Title', validators=[DataRequired(), Length(max=255)])
    description = TextAreaField('Description (Optional)', validators=[Optional()])
    ingredients = TextAreaField('Ingredients (One per line)', validators=[DataRequired()])
    instructions = TextAreaField('Instructions', validators=[DataRequired()])
    image_url = URLField('Image URL (Optional)', validators=[Optional(), Length(max=255)])
    submit = SubmitField('Save Recipe') # Text will be overridden in template