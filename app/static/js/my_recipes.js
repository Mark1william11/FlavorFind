// app/static/js/my_recipes.js

document.addEventListener('DOMContentLoaded', function() {
    fetchMyRecipes();
});

async function fetchMyRecipes() {
    const recipesListDiv = document.getElementById('my-recipes-list');
    if (!recipesListDiv) { return; }
    recipesListDiv.innerHTML = '<p class="text-muted">Loading your recipes...</p>';

    try {
        const response = await fetch('/api/recipes'); // Default method is GET

        if (response.status === 401) {
            recipesListDiv.innerHTML = '<p class="alert alert-warning">You must be logged in. <a href="/login">Login here</a>.</p>';
            return;
        }
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ error: 'Failed to fetch recipes.' }));
            throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
        }
        const recipes = await response.json();
        displayMyRecipes(recipes);

    } catch (error) {
        console.error('Error fetching recipes:', error);
        recipesListDiv.innerHTML = `<p class="alert alert-danger">Error loading recipes: ${error.message}</p>`;
    }
}

function displayMyRecipes(recipes) {
    const recipesListDiv = document.getElementById('my-recipes-list');
     recipesListDiv.innerHTML = ''; // Clear loading/previous

    if (!recipes || recipes.length === 0) {
        recipesListDiv.innerHTML = '<p>You haven\'t added any recipes yet. <a href="/recipe/new" class="btn btn-sm btn-outline-primary">Create your first recipe!</a></p>';
        return;
    }

    // Use Bootstrap List Group
    const ul = document.createElement('ul');
    ul.className = 'list-group shadow-sm'; // Add list-group class

    recipes.forEach(recipe => {
        const li = document.createElement('li');
        // Add list-group-item classes for styling and layout
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <div>
                <a href="/recipe/${recipe.recipe_id}" class="fw-bold text-decoration-none me-2">${recipe.title}</a>
                <small class="text-muted">(Updated: ${new Date(recipe.updated_at).toLocaleDateString()})</small>
            </div>
            <div>
                 <a href="/recipe/${recipe.recipe_id}/edit" class="btn btn-sm btn-outline-secondary me-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg> Edit
                </a>
                 <button class="btn btn-sm btn-outline-danger delete-recipe-btn" data-recipe-id="${recipe.recipe_id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm-1-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg> Delete
                </button>
            </div>
        `;
        ul.appendChild(li);
    });
    recipesListDiv.appendChild(ul);
    addDeleteButtonListeners(); // Attach listeners
}

// --- Delete Functionality (remains mostly the same logic) ---
function addDeleteButtonListeners() {
    const deleteButtons = document.querySelectorAll('.delete-recipe-btn');
    deleteButtons.forEach(button => {
        // Remove previous listener to avoid duplicates if list refreshes
        button.removeEventListener('click', handleDeleteClick);
        button.addEventListener('click', handleDeleteClick);
    });
}

async function handleDeleteClick(event) {
    const button = event.target.closest('button'); // Ensure we target the button
    const recipeId = button.dataset.recipeId;
    const recipeTitle = button.closest('li').querySelector('a.fw-bold').textContent;

    // Use Bootstrap modal for confirmation if available, otherwise use confirm()
    // For simplicity, we stick with confirm() for now.
    if (confirm(`Are you sure you want to delete the recipe "${recipeTitle}"? This action cannot be undone.`)) {
        button.disabled = true; // Disable button during deletion
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'; // Loading indicator
        await deleteRecipe(recipeId, button);
    }
}


async function deleteRecipe(recipeId, buttonElement) {
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
             // Remove the list item visually or just refresh the whole list
             fetchMyRecipes(); // Easiest is to just refresh
             // Optionally show a temporary success message (using flash or dynamically adding an alert)
         } else {
             const errorResult = await response.json().catch(() => ({ error: 'Failed to delete recipe.' }));
             alert(`Error: ${errorResult.error || `HTTP error! status: ${response.status}`}`);
             if (buttonElement) buttonElement.disabled = false; // Re-enable button on error
         }
    } catch (error) {
         console.error('Error deleting recipe:', error);
         alert(`An error occurred: ${error.message}`);
         if (buttonElement) buttonElement.disabled = false; // Re-enable button on error
    }
}