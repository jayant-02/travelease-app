/*
  main.js — Shared Auth Logic
  This file runs on EVERY page. It handles:
  1. Checking if the user is logged in (via JWT in localStorage)
  2. Updating the navbar to show/hide login/logout buttons
  3. Injecting the Auth Modal (Sign In / Sign Up forms)
  4. Handling login and signup API calls
  HOW AUTH WORKS (for reverse engineering):
  ─────────────────────────────────────────
  • On signup, the backend hashes the password with bcrypt and
  stores it in the SQLite database.
  • On login, the backend verifies the password and returns a
  JWT token (valid for 7 days).
  • The frontend stores this token in localStorage.
  • Every protected API call sends the token in the
  "Authorization: Bearer <token>" header.
  • The backend middleware decodes the token to identify the user.
*/

const API_BASE = 'http://localhost:3000/api';


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TOKEN & USER STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentUser = null;

function getToken() {
    return localStorage.getItem('travelease_token');
}

function setToken(token, user) {
    localStorage.setItem('travelease_token', token);
    localStorage.setItem('travelease_user', JSON.stringify(user));
    currentUser = user;
    updateNavbarAuth();
}

function logout() {
    localStorage.removeItem('travelease_token');
    localStorage.removeItem('travelease_user');
    currentUser = null;
    updateNavbarAuth();

    // If on a protected page, redirect home
    if (window.location.pathname.includes('bookings.html')) {
        window.location.href = 'index.html';
    }
}

function loadUser() {
    const userStr = localStorage.getItem('travelease_user');
    if (userStr) {
        try { currentUser = JSON.parse(userStr); } catch (e) { currentUser = null; }
    }
    updateNavbarAuth();
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NAVBAR UI UPDATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateNavbarAuth() {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    if (currentUser) {
        // User is logged in — show their name, bookings link, and logout
        navActions.innerHTML = `
            <a href="bookings.html" class="nav-link-bookings">My Bookings</a>
            <button class="btn-nav" onclick="logout()">Logout</button>
        `;
    } else {
        // Not logged in — show Sign In button
        navActions.innerHTML = `
            <button class="btn-nav" onclick="openAuthModal()">Sign In</button>
        `;
    }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AUTH MODAL (Inject once on page load)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function injectAuthModal() {
    // Don't inject twice
    if (document.getElementById('authModal')) return;

    const html = `
    <div class="modal-overlay" id="authModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeAuthModal()">&times;</button>
            <h2 class="modal-title">Welcome to TravelEase</h2>
            <p class="modal-subtitle">Sign in to search routes and book tickets.</p>

            <div class="auth-tabs">
                <button type="button" class="auth-tab active" onclick="switchAuthTab('login')">Log In</button>
                <button type="button" class="auth-tab" onclick="switchAuthTab('signup')">Sign Up</button>
            </div>

            <div id="authError" class="auth-error"></div>
            <div id="authSuccess" class="auth-success"></div>

            <!-- Login Form -->
            <form id="loginForm" class="auth-form active" onsubmit="handleAuth(event, 'login')">
                <div class="form-field">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="you@example.com" required>
                </div>
                <div class="form-field">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="••••••••" required>
                </div>
                <button type="submit" class="auth-btn">Log In</button>
            </form>

            <!-- Signup Form -->
            <form id="signupForm" class="auth-form" onsubmit="handleAuth(event, 'signup')">
                <div class="form-field">
                    <label>Full Name</label>
                    <input type="text" name="username" placeholder="Your name" required>
                </div>
                <div class="form-field">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="you@example.com" required>
                </div>
                <div class="form-field">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Min 6 characters" minlength="6" required>
                </div>
                <button type="submit" class="auth-btn">Create Account</button>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('active');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        // Clear any error/success messages
        const err = document.getElementById('authError');
        const suc = document.getElementById('authSuccess');
        if (err) err.style.display = 'none';
        if (suc) suc.style.display = 'none';
    }
}

function switchAuthTab(tab) {
    // Update tab active states
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }

    // Clear messages on tab switch
    document.getElementById('authError').style.display = 'none';
    document.getElementById('authSuccess').style.display = 'none';
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HANDLE LOGIN / SIGNUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleAuth(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/auth/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            errorEl.textContent = result.message;
            errorEl.style.display = 'block';
            return;
        }

        // Success — save token and close modal
        setToken(result.token, result.user);
        form.reset();
        closeAuthModal();

        // If a page-specific callback exists (e.g. seat selection page),
        // call it so the action can continue after login
        if (window.onAuthSuccess) {
            window.onAuthSuccess();
        }

    } catch (err) {
        errorEl.textContent = 'Cannot connect to server. Make sure the backend is running on port 3000.';
        errorEl.style.display = 'block';
    }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INITIALIZE ON PAGE LOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
    injectAuthModal();
    loadUser();
});
