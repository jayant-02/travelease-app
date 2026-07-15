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
  • Signup pe, backend password ko bcrypt se hash karke SQLite DB mein save karta hai.
  • Login pe, backend password verify karta hai aur JWT token (7 days valid) deta hai.
  • Frontend is token ko localStorage mein rakhta hai.
  • Har protected API call mein token ko "Authorization: Bearer <token>" header mein bheja jata hai.
  • Backend middleware token ko decode karke user ki identity check karta hai.
*/

// ==========================================
// GLOBALS & CONFIG (Poore app ki settings)
// ==========================================
const API_BASE = 'http://localhost:8080/api';

let currentUser = null;

// ==========================================
// AUTHENTICATION LOGIC (Login/Signup ka funda)
// ==========================================

// Token lao
function getToken() {
    return localStorage.getItem('te_token');
}

// Token local storage mein daalo
function setToken(token, user) {
    localStorage.setItem('te_token', token);
    localStorage.setItem('te_user', JSON.stringify(user));
    currentUser = user;
    updateNavbarAuth();
}

// Token nikal lo (logout karte waqt)
function logout() {
    localStorage.removeItem('te_token');
    localStorage.removeItem('te_user');
    currentUser = null;
    updateNavbarAuth();

    // Agar protected page pe ho, toh home pe bhej do
    if (window.location.pathname.includes('bookings.html')) {
        window.location.href = 'index.html';
    }
}

function loadUser() {
    const userStr = localStorage.getItem('te_user');
    if (userStr) {
        try { currentUser = JSON.parse(userStr); } catch (e) { currentUser = null; }
    }
    updateNavbarAuth();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NAVBAR UI UPDATE
// Navbar mein login/logout button dikhana
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateNavbarAuth() {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    if (currentUser) {
        // Agar user login hai — toh 'My Bookings' aur 'Logout' dikhao
        navActions.innerHTML = `
            <a href="bookings.html" class="nav-link-bookings">My Bookings</a>
            <button class="btn-nav" onclick="logout()">Logout</button>
        `;
    } else {
        // Login nahi hai — toh Sign In button dikhao
        navActions.innerHTML = `
            <button class="btn-nav" onclick="openAuthModal()">Sign In</button>
        `;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AUTH MODAL (Inject once on page load)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function injectAuthModal() {
    // Double injection se bachao
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
        // Purane messages saaf karo
        const err = document.getElementById('authError');
        const suc = document.getElementById('authSuccess');
        if (err) err.style.display = 'none';
        if (suc) suc.style.display = 'none';
    }
}

function switchAuthTab(tab) {
    // Tab active states update karo
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }

    // Tab switch karne pe messages hata do
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
    
    // Purane errors chupa do
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

        if (type === 'signup') {
            successEl.textContent = result.message;
            successEl.style.display = 'block';
            form.reset();
            // Thodi der baad khud hi login tab pe switch kardo
            setTimeout(() => switchAuthTab('login'), 1500);
            return;
        }

        // Login success — token save karo aur modal band karo
        setToken(result.token, result.user);
        form.reset();
        closeAuthModal();

        // Agar kisi page ne callback set kiya hai toh run karo
        if (window.onAuthSuccess) {
            window.onAuthSuccess();
        }

    } catch (err) {
        errorEl.textContent = 'Server se connect nahi ho pa raha. Check karo backend chal raha hai ya nahi.';
        errorEl.style.display = 'block';
    }
}

// ==========================================
// INIT (Page load hote hi ye run hoga)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Auth modal daalo
    injectAuthModal();
    // Check karo pehle se session hai kya
    loadUser();
});
