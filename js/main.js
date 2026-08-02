const API_BASE = 'http://localhost:8080/api';
let currentUser = null;

// Token aur user ko localStorage se nikaalo
const getToken = () => localStorage.getItem('te_token');

// Token aur user save karo localStorage me
const setToken = (token, user) => {
    localStorage.setItem('te_token', token);
    localStorage.setItem('te_user', JSON.stringify(user));
    currentUser = user;
    updateNavbarAuth();
};

// Logout logic - localStorage clear karo
const logout = () => {
    localStorage.removeItem('te_token');
    localStorage.removeItem('te_user');
    currentUser = null;
    updateNavbarAuth();
    
    // Protected pages se redirect karo
    const protectedPaths = ['/bookings.html', '/cab-booking.html', '/admin.html'];
    if (protectedPaths.some(path => window.location.pathname.includes(path))) {
        window.location.href = 'index.html';
    }
};

// User data load karo on page load
const loadUser = () => {
    const userStr = localStorage.getItem('te_user');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    updateNavbarAuth();
};

// Navbar UI update karo based on auth state
const updateNavbarAuth = () => {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    if (currentUser) {
        let adminLink = '';
        if (currentUser.role === 'admin') {
            adminLink = `<a href="admin.html" class="nav-link">Admin Panel</a>`;
        }
        navActions.innerHTML = `
            ${adminLink}
            <a href="bookings.html" class="nav-link">My Bookings</a>
            <button onclick="logout()" class="btn btn-outline">Logout</button>
        `;
    } else {
        navActions.innerHTML = `
            <button onclick="openAuthModal()" class="btn btn-primary">Sign In</button>
        `;
    }
};

// Auth modal ka HTML inject karo body me
const injectAuthModal = () => {
    const modalHTML = `
    <div id="authModal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <button class="modal-close" onclick="closeAuthModal()"><i class="fas fa-times"></i></button>
            
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="switchAuthTab('login')">Login</button>
                <button class="auth-tab" onclick="switchAuthTab('signup')">Sign Up</button>
            </div>

            <!-- Login Form -->
            <form id="loginForm" onsubmit="handleAuth(event, 'login')">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required class="form-control" placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" required class="form-control" placeholder="Enter password">
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
                <div id="loginError" class="error-text"></div>
            </form>

            <!-- Signup Form -->
            <form id="signupForm" onsubmit="handleAuth(event, 'signup')" style="display: none;">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="signupName" required class="form-control" placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="signupEmail" required class="form-control" placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="signupPassword" required class="form-control" placeholder="Create a password">
                </div>
                <button type="submit" class="btn btn-primary w-100">Sign Up</button>
                <div id="signupError" class="error-text"></div>
                <div id="signupSuccess" class="success-text"></div>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Modal open/close functions
const openAuthModal = () => {
    document.getElementById('authModal').style.display = 'flex';
};

const closeAuthModal = () => {
    document.getElementById('authModal').style.display = 'none';
};

// Login aur signup tabs switch karo
const switchAuthTab = (tab) => {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
};

// Authentication handle karo (API call)
const handleAuth = async (event, type) => {
    event.preventDefault();
    const errorEl = document.getElementById(`${type}Error`);
    if(errorEl) errorEl.textContent = '';
    
    let url = `${API_BASE}/auth/${type}`;
    let body = {};

    if (type === 'login') {
        body.email = document.getElementById('loginEmail').value;
        body.password = document.getElementById('loginPassword').value;
    } else {
        body.name = document.getElementById('signupName').value;
        body.email = document.getElementById('signupEmail').value;
        body.password = document.getElementById('signupPassword').value;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Authentication failed');
        }

        if (type === 'login') {
            // Login successful
            setToken(data.token, data.user);
            closeAuthModal();
            if (typeof window.onAuthSuccess === 'function') {
                window.onAuthSuccess();
            }
        } else {
            // Signup successful - login tab par switch karo
            document.getElementById('signupSuccess').textContent = 'Account created successfully! Please login.';
            setTimeout(() => {
                switchAuthTab('login');
                document.getElementById('loginEmail').value = body.email;
                document.getElementById('signupSuccess').textContent = '';
                document.getElementById('signupForm').reset();
            }, 2000);
        }
    } catch (error) {
        if(errorEl) errorEl.textContent = error.message;
    }
};

// Jab page load ho, modal inject karo aur user load karo
document.addEventListener('DOMContentLoaded', () => {
    injectAuthModal();
    loadUser();
});
