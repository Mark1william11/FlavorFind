// app/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Logout Link Handler ---
    const logoutLink = document.getElementById('logout-link'); // We need to add this ID to the link

    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default link navigation

            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                        // No 'Content-Type' needed for empty body POST
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