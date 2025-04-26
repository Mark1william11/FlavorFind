// // app/static/js/search.js

// const searchByNameBtn = document.getElementById('search-by-name-btn');
// const searchByIngredientBtn = document.getElementById('search-by-ingredient-btn');
// const searchQueryInput = document.getElementById('search-query');
// const searchIngredientInput = document.getElementById('search-ingredient');
// const searchResultsDiv = document.getElementById('search-results');

// // Helper function to display results
// function displayResults(meals) {
//     searchResultsDiv.innerHTML = ''; // Clear previous results

//     if (!meals || meals.length === 0) {
//         searchResultsDiv.innerHTML = '<p>No recipes found matching your criteria.</p>';
//         return;
//     }

//     const ul = document.createElement('ul');
//     meals.forEach(meal => {
//         const li = document.createElement('li');
//         // Basic display: image, name. Could link to a detail view later.
//         li.innerHTML = `
//             <img src="${meal.image_url}" alt="${meal.name}" width="100" style="vertical-align: middle; margin-right: 10px;">
//             <span>${meal.name} (ID: ${meal.id})</span>
//             <!-- Add a button/link for details later if needed -->
//         `;
//         ul.appendChild(li);
//     });
//     searchResultsDiv.appendChild(ul);
// }

// // Helper function to display errors
// function displaySearchError(message) {
//      searchResultsDiv.innerHTML = `<p style="color: red;">Error: ${message}</p>`;
// }

// // Function to perform the search API call
// async function performSearch(searchType, query) {
//     let apiUrl = '/api/recipes/search?'; // Base URL for our backend endpoint

//     if (searchType === 'name') {
//         apiUrl += `query=${encodeURIComponent(query)}`;
//     } else if (searchType === 'ingredient') {
//          apiUrl += `ingredient=${encodeURIComponent(query)}`;
//     } else {
//         displaySearchError("Invalid search type.");
//         return;
//     }

//     searchResultsDiv.innerHTML = '<p style="font-style: italic; color: #555;">Searching...</p>'; 

//     try {
//         const response = await fetch(apiUrl);
//         // Add a small artificial delay to make loading visible (REMOVE FOR PRODUCTION)
//         // await new Promise(resolve => setTimeout(resolve, 500)); // e.g., 500ms delay

//         const result = await response.json();

//         if (response.ok) {
//             displayResults(result); // Display the results (which is the list of meals)
//         } else {
//             // Display error from our backend API response
//             displaySearchError(result.error || 'Failed to fetch recipes.');
//         }
//     } catch (error) {
//         console.error('Search Fetch Error:', error);
//         displaySearchError('An error occurred while searching. Please try again.');
//     }
// }


// // --- Event Listeners ---
// if (searchByNameBtn && searchQueryInput) {
//     searchByNameBtn.addEventListener('click', () => {
//         const query = searchQueryInput.value.trim();
//         if (query) {
//             performSearch('name', query);
//         } else {
//             displaySearchError("Please enter a recipe name to search.");
//         }
//     });
//     // Optional: Allow searching by pressing Enter in the input field
//     searchQueryInput.addEventListener('keypress', (event) => {
//         if (event.key === 'Enter') {
//             searchByNameBtn.click(); // Trigger button click
//         }
//     });
// }

// if (searchByIngredientBtn && searchIngredientInput) {
//     searchByIngredientBtn.addEventListener('click', () => {
//         const ingredient = searchIngredientInput.value.trim();
//         if (ingredient) {
//             performSearch('ingredient', ingredient);
//         } else {
//              displaySearchError("Please enter an ingredient to search.");
//         }
//     });
//      // Optional: Allow searching by pressing Enter in the input field
//      searchIngredientInput.addEventListener('keypress', (event) => {
//         if (event.key === 'Enter') {
//             searchByIngredientBtn.click(); // Trigger button click
//         }
//     });
// }

// app/static/js/search.js (Cleaned Version)

// --- Element References ---
const searchByNameBtn = document.getElementById('search-by-name-btn');
const searchByIngredientBtn = document.getElementById('search-by-ingredient-btn');
const searchQueryInput = document.getElementById('search-query');
const searchIngredientInput = document.getElementById('search-ingredient');
const searchResultsDiv = document.getElementById('search-results');
// Use Bootstrap's Modal class API
let recipeModalInstance = null; // To store the Bootstrap modal instance
document.addEventListener('DOMContentLoaded', () => {
    const modalElement = document.getElementById('recipeDetailModal');
    if (modalElement) {
        recipeModalInstance = new bootstrap.Modal(modalElement);
    }
});

// --- Debounce Function ---
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

// --- Debounced Search Function ---
// Create debounced versions of performSearch, wait e.g., 500ms after user stops typing
const debouncedSearchByName = debounce(function(query) {
    if (query && query.length > 1) { // Only search if query has at least 2 chars
       performSearch('name', query);
    } else if (!query) {
        searchResultsDiv.innerHTML = '<div class="col"><p>Enter a recipe name to search.</p></div>'; // Clear if input empty
    }
}, 500);

const debouncedSearchByIngredient = debounce(function(ingredient) {
    if (ingredient && ingredient.length > 1) { // Only search if query has at least 2 chars
       performSearch('ingredient', ingredient);
   } else if (!ingredient) {
        searchResultsDiv.innerHTML = '<div class="col"><p>Enter an ingredient to search.</p></div>'; // Clear if input empty
   }
}, 500); // 500ms delay

// --- Modal Handling Functions ---
function showModal() {
    // if(modal) modal.style.display = "block";
    // Reset content when showing
    const modalTitle = document.getElementById('modal-recipe-title');
    const modalBody = document.getElementById('modal-recipe-body');
    if(modalTitle) modalTitle.textContent = "Recipe Title";
    if(modalBody) modalBody.innerHTML = "<p>Loading details...</p>";
    if(recipeModalInstance) recipeModalInstance.show();
}

function hideModal() { // This might not be needed if using data-bs-dismiss
     if(recipeModalInstance) recipeModalInstance.hide();
}

async function showRecipeModal(mealId) {
    // Find specific elements needed for this operation
    const modalTitleEl = document.getElementById('modal-recipe-title');
    const modalBodyEl = document.getElementById('modal-recipe-body');
    if (!recipeModalInstance || !modalTitleEl || !modalBodyEl) {
        console.error("Cannot show recipe modal - required elements/instance not found.");
        return;
    }
     showModal(); // Show modal shell with loading message

    try {
        // Using fetch here to get details (fine as it works, or use XHR if strict consistency needed)
        const response = await fetch(`/api/recipes/external/${mealId}`);

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ error: 'Failed to load recipe details.' }));
            if (response.status === 404) {
                 throw new Error("Recipe not found.");
            }
            throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
        }

        const meal = await response.json();

        if (meal && meal.idMeal) {
            populateModal(meal, modalTitleEl, modalBodyEl); // Pass elements
        } else {
            throw new Error("Received invalid recipe details data.");
        }

    } catch(error) {
        console.error("Error fetching/showing recipe details:", error);
        if(modalBodyEl) modalBodyEl.innerHTML = `<p class="text-danger">Error loading details: ${error.message}</p>`;
        if(modalTitleEl) modalTitleEl.textContent = "Error";
    }
}

// Modified populateModal to accept elements as arguments - WITH LOGGING
function populateModal(meal, modalTitleEl, modalBodyEl) {
    if (!modalTitleEl || !modalBodyEl) {
        return;
    }
    try {
        modalTitleEl.textContent = meal.strMeal || "Recipe Details";
        let ingredientsHtml = '<ul>';
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== "") {
                ingredientsHtml += `<li>${measure ? measure.trim() : ''} <strong>${ingredient.trim()}</strong></li>`;
            } else { break; }
        }
        ingredientsHtml += '</ul>';
        const formattedInstructions = meal.strInstructions ? meal.strInstructions.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>') : 'No instructions provided.';
        const finalHtml = `
            <div class="text-center mb-3">
                 ${meal.strMealThumb ? `<img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="img-fluid rounded mb-3" style="max-height: 300px;">` : ''}
            </div>
            ${meal.strTags ? `<p><strong>Tags:</strong> <span class="badge bg-secondary me-1">${meal.strTags.split(',').join('</span> <span class="badge bg-secondary me-1">')}</span></p>` : ''}
            ${meal.strCategory ? `<p><strong>Category:</strong> ${meal.strCategory}</p>` : ''}
            ${meal.strArea ? `<p><strong>Area:</strong> ${meal.strArea}</p>` : ''}
            <h5 class="mt-4">Ingredients:</h5> ${ingredientsHtml}
            <h5 class="mt-4">Instructions:</h5> <p>${formattedInstructions}</p>
            <div class="mt-4 d-flex justify-content-between">
                ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" rel="noopener noreferrer" class="btn btn-danger btn-sm">Watch Video</a>` : '<div></div>'}
                ${meal.strSource ? `<a href="${meal.strSource}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">Original Source</a>` : '<div></div>'}
            </div>
        `;
        modalBodyEl.innerHTML = finalHtml;
    } catch (innerError) {
        // Catch errors specifically within populateModal
        console.error("[PopulateModal] ERROR during population:", innerError);
        modalBodyEl.innerHTML = `<p class="text-danger">Error displaying recipe details: ${innerError.message}</p>`;
        modalTitleEl.textContent = "Error";
    }
}


// --- Search Results Display Function (Includes Button - CORRECTED) ---
function displayResults(meals) {
    searchResultsDiv.innerHTML = ''; // Clear previous results
    if (!meals || meals.length === 0) {
        searchResultsDiv.innerHTML = '<div class="col"><p>No recipes found matching your criteria.</p></div>';
        return;
    }
    meals.forEach(meal => {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${meal.image_url}" class="card-img-top" alt="${meal.name}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${meal.name}</h5>
                    <button class="btn btn-primary mt-auto view-details-btn" data-meal-id="${meal.id}">View Details</button>
                </div>
            </div>
        `;
        searchResultsDiv.appendChild(col);
    });
    addDetailButtonListeners(); // Add event listeners
}

// --- Add Event Listener Setup for Detail Buttons ---
function addDetailButtonListeners() {
    const detailButtons = document.querySelectorAll('.view-details-btn');
    detailButtons.forEach(button => {
        // Remove old listener if any (safer if called multiple times)
        button.removeEventListener('click', handleDetailButtonClick);
        // Add new listener
        button.addEventListener('click', handleDetailButtonClick);
    });
}
// Define the handler function separately
function handleDetailButtonClick(event) {
    const mealId = event.target.dataset.mealId;
    showRecipeModal(mealId);
}

// --- Search Error Display Function ---
function displaySearchError(message) {
    searchResultsDiv.innerHTML = `<div class="col"><p class="text-danger">Error: ${message}</p></div>`;
}

// --- Perform Search Function (Using XMLHttpRequest) ---
function performSearch(searchType, query) {
    let apiUrl = '/api/recipes/search?';
    if (searchType === 'name') {
        apiUrl += `query=${encodeURIComponent(query)}`;
    } else if (searchType === 'ingredient') {
         apiUrl += `ingredient=${encodeURIComponent(query)}`;
    } else {
        displaySearchError("Invalid search type.");
        return;
    }
    searchResultsDiv.innerHTML = `<div class="col"><p class="text-muted fst-italic">Searching...</p></div>`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try { const result = JSON.parse(xhr.responseText); displayResults(result); }

            catch (e) { console.error("Error parsing JSON:", e); displaySearchError("Error processing results."); }
        } else {
            console.error("XHR Error:", xhr.status, xhr.statusText);

            let errMsg = `Failed to fetch (Status: ${xhr.status})`;

            try { const errRes = JSON.parse(xhr.responseText); errMsg = errRes.error || errMsg; } catch (e) {}

            displaySearchError(errMsg);
        }
    };
    xhr.onerror = function() { console.error('XHR Network Error'); displaySearchError('Network error.'); };
    xhr.timeout = 10000;
    xhr.ontimeout = function () { console.error('XHR Timeout'); displaySearchError('Search timed out.'); };
    xhr.send();
}

// --- Event Listeners for Search Buttons ---
// if (searchByNameBtn && searchQueryInput) {
//     searchByNameBtn.addEventListener('click', () => {
//         const query = searchQueryInput.value.trim();
//         if (query) { performSearch('name', query); }
//         else { displaySearchError("Please enter a recipe name to search."); }
//     });
//     searchQueryInput.addEventListener('keypress', (event) => {
//         if (event.key === 'Enter') { searchByNameBtn.click(); }
//     });
// }
// if (searchByIngredientBtn && searchIngredientInput) {
//     searchByIngredientBtn.addEventListener('click', () => {
//         const ingredient = searchIngredientInput.value.trim();
//         if (ingredient) { performSearch('ingredient', ingredient); }
//         else { displaySearchError("Please enter an ingredient to search."); }
//     });
//      searchIngredientInput.addEventListener('keypress', (event) => {
//         if (event.key === 'Enter') { searchByIngredientBtn.click(); }
//     });
// }



// Add INPUT event listeners for search-as-you-type
if (searchQueryInput) {
    searchQueryInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        debouncedSearchByName(query); // Call the debounced function
    });
}

if (searchIngredientInput) {
    searchIngredientInput.addEventListener('input', (event) => {
        const ingredient = event.target.value.trim();
        debouncedSearchByIngredient(ingredient); // Call the debounced function
    });
}

// Keep Enter key listeners if desired as an alternative trigger
if (searchQueryInput && searchByNameBtn) { // Check button exists if keeping logic
     searchQueryInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const query = event.target.value.trim();
             if (query) { performSearch('name', query); } // Perform immediately on Enter
             // searchByNameBtn.click(); // Or trigger button if keeping it
        }
    });
}
 if (searchIngredientInput && searchByIngredientBtn) { // Check button exists if keeping logic
     searchIngredientInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const ingredient = event.target.value.trim();
            if (ingredient) { performSearch('ingredient', ingredient); } // Perform immediately on Enter
             // searchByIngredientBtn.click(); // Or trigger button if keeping it
        }
    });
}



// --- Event Listeners for Modal Close ---
// if (closeButton) {
//     closeButton.addEventListener('click', hideModal);
// }
// window.addEventListener('click', function(event) {
//     if (event.target === modal) { hideModal(); }
// });
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && recipeModalInstance) {
        hideModal(); // Use hideModal which uses Bootstrap's API if available
    }
});