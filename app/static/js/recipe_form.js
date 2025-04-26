// app/static/js/recipe_form.js

const recipeForm = document.getElementById('recipe-form');
const messageArea = document.getElementById('recipe-form-message');

// Helper function to display messages using Bootstrap alert classes
function displayRecipeFormMessage(message, isError = false) {
    if (messageArea) {
        messageArea.textContent = message;
        // Reset classes, keep 'alert'
        messageArea.className = 'alert'; // Base Bootstrap class
        if (message) {
            messageArea.classList.add(isError ? 'alert-danger' : 'alert-success');
            messageArea.style.display = 'block'; // Show the alert
        } else {
             messageArea.style.display = 'none'; // Hide if no message
        }
    } else {
        console.error("Element with ID 'recipe-form-message' not found.");
    }
}

if (recipeForm) {
    recipeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        displayRecipeFormMessage(''); // Clear

        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            ingredients: document.getElementById('ingredients').value,
            instructions: document.getElementById('instructions').value,
            image_url: document.getElementById('image_url').value
        };
        const submitButton = recipeForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        if (!formData.title || !formData.ingredients || !formData.instructions) {
            displayRecipeFormMessage('Title, Ingredients, and Instructions are required.', true);
            return;
        }

        const mode = recipeForm.dataset.mode;
        let apiUrl;
        let method;
        let successMessage;

        if (mode === 'edit') {
            const recipeId = recipeForm.dataset.recipeId;
            apiUrl = `/api/recipes/${recipeId}`;
            method = 'PUT';
            successMessage = 'Recipe updated successfully! Redirecting...';
             submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...'; // Loading state
        } else {
            apiUrl = '/api/recipes';
            method = 'POST';
            successMessage = 'Recipe saved successfully! Redirecting...';
             submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...'; // Loading state
        }
        submitButton.disabled = true;


        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(formData),
            });
            const result = await response.json();

            if (response.ok) {
                displayRecipeFormMessage(successMessage, false);
                setTimeout(() => { window.location.href = '/my-recipes'; }, 1500);
            } else {
                displayRecipeFormMessage(result.error || `Failed to ${mode} recipe.`, true);
                submitButton.disabled = false; // Re-enable on error
                 submitButton.innerHTML = originalButtonText;
            }

        } catch (error) {
            console.error('Recipe Form Fetch Error:', error);
            displayRecipeFormMessage(`An network error occurred during ${mode}. Please try again.`, true);
            submitButton.disabled = false; // Re-enable on error
             submitButton.innerHTML = originalButtonText;
        }
    });
}