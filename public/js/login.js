// public/js/login.js

const socket = io();
const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username');
const errorEl = document.getElementById('error-message');

joinForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Stop the form from submitting normally
    
    const username = usernameInput.value;
    
    if (username) {
        // Clear any previous errors
        errorEl.textContent = '';
        
        // R3: Emit the 'joinLobby' event to the server for validation
        socket.emit('joinLobby', { username });
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