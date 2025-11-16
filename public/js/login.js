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
// public/js/login.js

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (tab === 'login') {
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
        } else {
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    });
});

// Password toggle functionality
const togglePasswordIcons = document.querySelectorAll('.toggle-password');

togglePasswordIcons.forEach(icon => {
    icon.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.classList.remove('fa-eye-slash');
            this.classList.add('fa-eye');
        } else {
            passwordInput.type = 'password';
            this.classList.remove('fa-eye');
            this.classList.add('fa-eye-slash');
        }
    });
});

// Login form handler - uses localStorage (no database needed)
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    errorEl.textContent = '';
    
    // Get registered users from localStorage
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Find user
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
        errorEl.textContent = 'Username not found. Please sign up first.';
        return;
    }
    
    if (user.password !== password) {
        errorEl.textContent = 'Incorrect password';
        return;
    }
    
    // Login successful
    localStorage.setItem('currentUser', username);
    window.location.href = `chat.html?username=${username}`;
});

// Signup form handler - stores in localStorage (no database needed)
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const errorEl = document.getElementById('signup-error');
    
    errorEl.textContent = '';
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Check if username already exists
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        errorEl.textContent = 'Username already taken';
        return;
    }
    
    
    // Add new user
    users.push({
        username: username,
        password: password // NOTE: In production, this should be hashed!
    });
    
    // Save to localStorage
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    // Auto login after signup
    localStorage.setItem('currentUser', username);
    window.location.href = `chat.html?username=${username}`;
});