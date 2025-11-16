const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username');
const errorEl = document.getElementById('error-message');

joinForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the form from submitting normally
    
    const username = usernameInput.value.trim();
    if (!username) {
        errorEl.textContent = 'Username cannot be empty';
        return;
    }
    errorEl.textContent = '';
    try {
        const r = await fetch('/api/username/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const body = await r.json();
        if (!r.ok) {
            errorEl.textContent = body.message || 'Validation failed';
            return;
        }
        // go to lobby on success
        window.location.href = `chat.html?username=${encodeURIComponent(username)}`;
    } catch (err) {
        errorEl.textContent = 'Network error';
    }
});

// Listen for a successful join
socket.on('joinSuccess', (username) => {
    // Redirect to the chat page
    window.location.href = `chat.html?username=${username}`;
});

// Listen for a join error (username taken)
socket.on('joinError', (errorMessage) => {
    // Display the error message
    errorEl.textContent = errorMessage;
});