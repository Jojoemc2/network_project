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

// Login form handler - uses database
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    errorEl.textContent = '';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            errorEl.textContent = data.message || 'Login failed';
            return;
        }
        
        // Login successful
        localStorage.setItem('currentUser', username);
        window.location.href = `chat.html?username=${encodeURIComponent(username)}`;
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
        console.error('Login error:', error);
    }
});

// Signup form handler - stores in database
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
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
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            errorEl.textContent = data.message || 'Signup failed';
            return;
        }
        
        // Auto login after signup
        localStorage.setItem('currentUser', username);
        window.location.href = `chat.html?username=${encodeURIComponent(username)}`;
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
        console.error('Signup error:', error);
    }
});