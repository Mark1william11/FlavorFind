// app/static/js/recipe_detail.js

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('recipe-detail-container');
    if (container) {
        const recipeId = container.dataset.recipeId;
        if (recipeId) { fetchRecipeDetails(recipeId); }
        else { displayDetailError("Recipe ID not found."); }
    }
});

async function fetchRecipeDetails(recipeId) {
    const contentDiv = document.getElementById('recipe-content');
    const titleElement = document.getElementById('recipe-title');
    const actionsDiv = document.getElementById('recipe-actions');
    // Set loading state using Bootstrap spinner (optional)
    contentDiv.innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>`;
    if (titleElement) titleElement.textContent = 'Loading Recipe...';
    if (actionsDiv) actionsDiv.style.display = 'none';
    displayDetailMessage(''); // Clear messages

    try {
        const response = await fetch(`/api/recipes/${recipeId}`);
        if (response.status === 401) {
            displayDetailError('You must be logged in. <a href="/login">Login</a>');
            if (titleElement) titleElement.textContent = 'Unauthorized';
            return;
        }
         if (response.status === 404) {
            displayDetailError('Recipe not found or permission denied.');
             if (titleElement) titleElement.textContent = 'Not Found';
            return;
        }
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ error: 'Failed to load details.' }));
            throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
        }
        const recipe = await response.json();
        populateRecipeDetail(recipe, recipeId); // Pass ID for actions

    } catch (error) {
        console.error('Error fetching details:', error);
        displayDetailError(`Error loading recipe: ${error.message}`);
        if (titleElement) titleElement.textContent = 'Error';
    }
}

// Populates the main content area (not a modal)
function populateRecipeDetail(recipe, recipeId) {
    const contentDiv = document.getElementById('recipe-content');
    const titleElement = document.getElementById('recipe-title');
    const actionsDiv = document.getElementById('recipe-actions');
    const editLink = document.getElementById('edit-recipe-link');
    const deleteButton = document.getElementById('delete-recipe-btn');

    if (!contentDiv || !titleElement || !actionsDiv || !editLink || !deleteButton) {
        console.error("Required detail page elements not found.");
        contentDiv.innerHTML = '<p class="text-danger">Error displaying recipe details (UI elements missing).</p>';
        return;
    }

    titleElement.textContent = recipe.title;
    document.title = `${recipe.title} - FlavorFind`; // Update browser tab

    const formattedIngredients = recipe.ingredients.replace(/\n/g, '<br>');
    const formattedInstructions = recipe.instructions.replace(/\n/g, '<br>');

    contentDiv.innerHTML = `
        <div class="row">
            <div class="col-md-4 text-center mb-3">
                 ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.title}" class="img-fluid rounded shadow-sm" style="max-height: 300px;">` : '<p class="text-muted">(No image provided)</p>'}
            </div>
            <div class="col-md-8">
                ${recipe.description ? `<p class="lead">${recipe.description}</p>` : ''}
                 <p><small class="text-muted">Added by: ${recipe.author_username} on ${new Date(recipe.created_at).toLocaleDateString()} | Last updated: ${new Date(recipe.updated_at).toLocaleDateString()}</small></p>
            </div>
        </div>
        <hr>
        <div class="row mt-4">
            <div class="col-md-5">
                <h4>Ingredients:</h4>
                <p>${formattedIngredients}</p> {# Using <p> assuming <br> provides breaks #}
            </div>
             <div class="col-md-7">
                <h4>Instructions:</h4>
                <p>${formattedInstructions}</p>
            </div>
        </div>
    `;

    // Show actions and set up listeners
    actionsDiv.style.display = 'block';
    editLink.href = `/recipe/${recipeId}/edit`; // Set correct edit link
    // Ensure delete listener is attached correctly
    deleteButton.removeEventListener('click', handleDeleteDetailClick); // Remove old one first
    deleteButton.addEventListener('click', handleDeleteDetailClick);
    // Store recipe details on the button if needed for confirmation message
    deleteButton.dataset.recipeId = recipeId;
    deleteButton.dataset.recipeTitle = recipe.title;
}

// Handler for delete button click on detail page
async function handleDeleteDetailClick(event) {
    const button = event.target.closest('button');
    const recipeId = button.dataset.recipeId;
    const recipeTitle = button.dataset.recipeTitle;

    if (confirm(`Are you sure you want to delete the recipe "${recipeTitle}"? This action cannot be undone.`)) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        await deleteRecipeFromDetail(recipeId, button);
    }
}


// Helper to display errors in the content area
function displayDetailError(message) {
     const contentDiv = document.getElementById('recipe-content');
     if (contentDiv) contentDiv.innerHTML = `<p class="alert alert-danger">${message}</p>`;
}

// Helper to display messages in the specific message area using Bootstrap
function displayDetailMessage(message, isError = false) {
    const msgArea = document.getElementById('detail-message-area');
     if (msgArea) {
        msgArea.textContent = message;
        msgArea.className = 'alert mt-3'; // Base classes
        if (message) {
            msgArea.classList.add(isError ? 'alert-danger' : 'alert-success');
            msgArea.style.display = 'block';
        } else {
             msgArea.style.display = 'none';
        }
    }
}

// Delete function specific to the detail page
async function deleteRecipeFromDetail(recipeId, buttonElement) {
    displayDetailMessage('Deleting...', false);

    // Get CSRF token
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
    let csrfToken = csrfTokenMeta ? csrfTokenMeta.getAttribute('content') : null;

    if (!csrfToken) {
         alert("Error: Could not perform delete securely. CSRF token missing.");
         if (buttonElement) buttonElement.disabled = false;
         return;
    }

    try {
         const response = await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE',
            headers: {
                 'X-CSRFToken': csrfToken
             }
          });
         if (response.ok) {
             displayDetailMessage('Recipe deleted successfully! Redirecting...', false);
             setTimeout(() => { window.location.href = '/my-recipes'; }, 1500);
         } else {
             const errorResult = await response.json().catch(() => ({ error: 'Failed to delete recipe.' }));
             displayDetailMessage(`Error: ${errorResult.error || `HTTP error! status: ${response.status}`}`, true);
             if (buttonElement) buttonElement.disabled = false; // Re-enable button
         }
    } catch (error) {
         console.error('Error deleting recipe:', error);
         displayDetailMessage(`An error occurred: ${error.message}`, true);
         if (buttonElement) buttonElement.disabled = false; // Re-enable button
    }
}