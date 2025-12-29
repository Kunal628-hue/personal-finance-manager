// ===== Authentication Management =====

// Password toggle functionality
function initPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', () => {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            toggleConfirmPassword.querySelector('i').classList.toggle('fa-eye');
            toggleConfirmPassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
    if (successEl) {
        successEl.classList.remove('show');
    }
}

// Show success message
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    const errorEl = document.getElementById('errorMessage');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.add('show');
    }
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

// Hide messages
function hideMessages() {
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    if (errorEl) errorEl.classList.remove('show');
    if (successEl) successEl.classList.remove('show');
}

// Get all users from localStorage
function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Get current user
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

// Set current user
function setCurrentUser(email) {
    localStorage.setItem('currentUser', email);
}

// Clear current user (logout)
function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

// Check if user is logged in
function isLoggedIn() {
    return !!getCurrentUser();
}

// Get user-specific storage key
function getUserStorageKey(key) {
    const user = getCurrentUser();
    return user ? `${key}_${user}` : key;
}

// ===== Sign Up =====
function handleSignup(e) {
    e.preventDefault();
    hideMessages();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Check if user already exists
    const users = getUsers();
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
        showError('An account with this email already exists');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password, // In production, this should be hashed
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Initialize user-specific data
    const userKey = getUserStorageKey('transactions');
    localStorage.setItem(userKey, JSON.stringify([]));
    
    showSuccess('Account created successfully! Redirecting to login...');
    
    // Redirect to login after 1.5 seconds
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

// ===== Login =====
function handleLogin(e) {
    e.preventDefault();
    hideMessages();
    
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    
    // Validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Check if user exists
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showError('Invalid email or password');
        return;
    }
    
    // Set current user
    setCurrentUser(email);
    
    showSuccess('Login successful! Redirecting...');
    
    // Redirect to dashboard after 1 second
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ===== Initialize Auth Pages =====
function initAuth() {
    initPasswordToggle();
    
    // Check if we're on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if we're on signup page
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // If user is already logged in and on auth pages, redirect to dashboard
    if (isLoggedIn() && (loginForm || signupForm)) {
        window.location.href = 'index.html';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Export functions for use in other files
window.auth = {
    isLoggedIn,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    getUserStorageKey
};

