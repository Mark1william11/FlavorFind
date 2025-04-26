// app/static/js/auth.js

// Helper function to display messages using Bootstrap alert classes
function displayMessage(elementId, message, isError = false) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        // Reset classes, keep 'alert'
        messageElement.className = 'alert'; // Base Bootstrap class
        if (message) {
            messageElement.classList.add(isError ? 'alert-danger' : 'alert-success');
            messageElement.style.display = 'block'; // Show the alert
        } else {
             messageElement.style.display = 'none'; // Hide if no message
        }
    } else {
        console.error(`Element with ID ${elementId} not found.`);
    }
}

// --- Login Form Handling ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        displayMessage('login-message', ''); // Clear

        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true; // Disable button
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...'; // Loading state


        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ identifier: identifier, password: password }),
            });
            const result = await response.json();

            if (response.ok) {
                displayMessage('login-message', result.message || 'Login successful!', false);
                setTimeout(() => { window.location.href = '/my-recipes'; }, 1000);
            } else {
                displayMessage('login-message', result.error || 'Login failed.', true);
                submitButton.disabled = false; // Re-enable button on error
                submitButton.innerHTML = originalButtonText;
            }
        } catch (error) {
            console.error('Login Fetch Error:', error);
            displayMessage('login-message', 'An error occurred during login. Please try again.', true);
            submitButton.disabled = false; // Re-enable button on error
            submitButton.innerHTML = originalButtonText;
        }
    });
}

// --- Registration Form Handling ---
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        displayMessage('register-message', ''); // Clear

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;


        if (password !== confirmPassword) {
            displayMessage('register-message', 'Passwords do not match!', true);
            return;
        }

        submitButton.disabled = true; // Disable button
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...'; // Loading state


        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ username: username, email: email, password: password }),
            });
            const result = await response.json();

            if (response.ok) {
                displayMessage('register-message', result.message || 'Registration successful! Redirecting to login...', false);
                setTimeout(() => { window.location.href = '/login'; }, 2000);
            } else {
                displayMessage('register-message', result.error || 'Registration failed.', true);
                submitButton.disabled = false; // Re-enable on error
                 submitButton.innerHTML = originalButtonText;
            }
        } catch (error) {
            console.error('Registration Fetch Error:', error);
            displayMessage('register-message', 'An error occurred during registration. Please try again.', true);
            submitButton.disabled = false; // Re-enable on error
             submitButton.innerHTML = originalButtonText;
        }
    });
}