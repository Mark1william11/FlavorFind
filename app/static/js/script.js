// app/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Logout Link Handler ---
    const logoutLink = document.getElementById('logout-link'); // We need to add this ID to the link

    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default link navigation

            // Need to get the token. Since it might not be in a form,
            // let's try getting it from a meta tag (if we add one) or a global JS var.
            // Easiest: Get it from *any* form on the page if one exists.
            const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
            let csrfToken = null;
            if (csrfTokenMeta) {
                csrfToken = csrfTokenMeta.getAttribute('content');
            } else {
                console.error("CSRF Token not found for logout!");
                // Optionally, try reading from a meta tag if you add one in base.html:
                // const csrfMeta = document.querySelector('meta[name="csrf-token"]');
                // if (csrfMeta) csrfToken = csrfMeta.content;
            }

            if (!csrfToken) {
                alert("Error: Could not perform logout securely. CSRF token missing from page.");
                console.error("CSRF meta tag not found or has no content.");
                return; // Don't proceed
            }

            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    console.log("Logout successful via JS.");
                    // Redirect to login page after successful logout
                    window.location.href = '/login';
                } else {
                    // Should ideally not happen if logout is only shown when logged in,
                    // but handle potential errors anyway.
                    alert(`Logout failed: ${result.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Logout Fetch Error:', error);
                alert('An error occurred during logout. Please try again.');
            }
        });
    }
});