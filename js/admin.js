document.addEventListener('DOMContentLoaded', () => {
    // Admin check karo
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Sidebar navigation setup
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-nav-item').forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');
            
            const section = e.target.dataset.section;
            document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
            const targetSection = document.getElementById(`${section}Section`);
            if (targetSection) targetSection.style.display = 'block';
            
            // Relevant data load karo
            if (section === 'dashboard') loadDashboard();
            if (section === 'routes') loadRoutes();
            if (section === 'bookings') loadBookings();
            if (section === 'users') loadUsers();
        });
    });

    loadDashboard(); // Default view
});

const getAuthHeader = () => ({ 'Authorization': `Bearer ${getToken()}` });

// Dashboard stats load karo
const loadDashboard = async () => {
    try {
        const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: getAuthHeader() });
        const data = await res.json();
        
        const statTotalRoutes = document.getElementById('statTotalRoutes');
        const statTotalBookings = document.getElementById('statTotalBookings');
        const statTotalUsers = document.getElementById('statTotalUsers');
        const statTotalRevenue = document.getElementById('statTotalRevenue');
        
        if (statTotalRoutes) statTotalRoutes.textContent = data.totalRoutes || 0;
        if (statTotalBookings) statTotalBookings.textContent = data.totalBookings || 0;
        if (statTotalUsers) statTotalUsers.textContent = data.totalUsers || 0;
        if (statTotalRevenue) statTotalRevenue.textContent = `₹${data.totalRevenue || 0}`;
    } catch (e) {
        console.error('Dashboard load failed:', e);
    }
};

// Routes management
const loadRoutes = async () => {
    try {
        const res = await fetch(`${API_BASE}/admin/routes`, { headers: getAuthHeader() });
        const routes = await res.json();
        
        const tbody = document.getElementById('routesTableBody');
        if (!tbody) return;
        tbody.innerHTML = routes.map(r => `
            <tr>
                <td>${r.operator}</td>
                <td>${r.type}</td>
                <td>${r.origin} → ${r.destination}</td>
                <td>₹${r.price}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRoute('${r._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
};

window.deleteRoute = async (id) => {
    if(!confirm('Delete this route?')) return;
    try {
        await fetch(`${API_BASE}/admin/routes/${id}`, { method: 'DELETE', headers: getAuthHeader() });
        loadRoutes();
    } catch(e) { console.error(e); }
};

// Bookings list load karo
const loadBookings = async () => {
    try {
        const res = await fetch(`${API_BASE}/admin/bookings`, { headers: getAuthHeader() });
        const bookings = await res.json();
        
        const tbody = document.getElementById('bookingsTableBody');
        if (!tbody) return;
        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td>${b._id.substring(18)}</td>
                <td>${b.user?.name || 'Unknown'}</td>
                <td>${b.route?.origin} → ${b.route?.destination}</td>
                <td>${b.seats}</td>
                <td><span class="badge badge-${b.status === 'confirmed' ? 'success' : 'danger'}">${b.status}</span></td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
};

// Users list load karo
const loadUsers = async () => {
    try {
        const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeader() });
        const users = await res.json();
        
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>
                    ${u.role === 'user' ? `<button class="btn btn-sm btn-primary" onclick="promoteUser('${u._id}')">Promote Admin</button>` : 'Admin'}
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
};

window.promoteUser = async (id) => {
    // optional helper
    if(!confirm('Promote to admin?')) return;
    try {
        await fetch(`${API_BASE}/admin/users/${id}/promote`, { method: 'PUT', headers: getAuthHeader() });
        loadUsers();
    } catch(e) { console.error(e); }
};
