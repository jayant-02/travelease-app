document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const [bookingsRes, cabsRes] = await Promise.all([
            fetch(`${API_BASE}/bookings/my`, { headers: { 'Authorization': `Bearer ${getToken()}` } }),
            fetch(`${API_BASE}/cabs/my`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        ]);

        const bookings = await bookingsRes.json();
        const cabs = await cabsRes.json();

        calculateStats(bookings);
        renderBookings(bookings);
        renderCabs(cabs);
    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
});

// Stats calculate karo
const calculateStats = (bookings) => {
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    document.getElementById('totalTrips').textContent = confirmed.length;
    
    const totalSpent = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);
    document.getElementById('totalSpent').textContent = `₹${totalSpent}`;

    if (confirmed.length > 0) {
        const destCount = {};
        let favCity = '';
        let maxCount = 0;
        
        confirmed.forEach(b => {
            const dest = b.route.destination;
            destCount[dest] = (destCount[dest] || 0) + 1;
            if (destCount[dest] > maxCount) {
                maxCount = destCount[dest];
                favCity = dest;
            }
        });
        document.getElementById('favCity').textContent = favCity;
    }
};

// Route bookings render karo
const renderBookings = (bookings) => {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    if (bookings.length === 0) {
        container.innerHTML = '<p>No bookings found.</p>';
        return;
    }

    container.innerHTML = bookings.map(b => `
        <div class="booking-card">
            <div class="d-flex justify-between">
                <h4>${b.route.origin} to ${b.route.destination}</h4>
                <span class="badge badge-${b.status === 'confirmed' ? 'success' : 'danger'}">${b.status}</span>
            </div>
            <p><strong>Date:</strong> ${new Date(b.travelDate).toLocaleDateString()}</p>
            <p><strong>Seats:</strong> ${b.seats}</p>
            <p><strong>Total:</strong> ₹${b.totalPrice}</p>
            ${b.status === 'confirmed' ? `<button onclick="cancelBooking('${b._id}')" class="btn btn-outline-danger mt-2">Cancel Ticket</button>` : ''}
        </div>
    `).join('');
};

// Cab bookings render karo
const renderCabs = (cabs) => {
    const container = document.getElementById('cabBookingsList');
    if (!container) return; // if element doesn't exist on page
    if (cabs.length === 0) {
        container.innerHTML = '<p>No cab bookings found.</p>';
        return;
    }

    container.innerHTML = cabs.map(c => `
        <div class="booking-card">
            <div class="d-flex justify-between">
                <h4>Cab: ${c.pickup} to ${c.dropoff}</h4>
                <span class="badge badge-${c.status === 'confirmed' ? 'success' : 'danger'}">${c.status}</span>
            </div>
            <p><strong>Type:</strong> <span class="capitalize">${c.cabType}</span></p>
            <p><strong>Estimated Fare:</strong> ₹${c.estimatedFare}</p>
            ${c.status === 'confirmed' ? `<button onclick="cancelCab('${c._id}')" class="btn btn-outline-danger mt-2">Cancel Cab</button>` : ''}
        </div>
    `).join('');
};

// Booking cancel API call
window.cancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;
    try {
        const res = await fetch(`${API_BASE}/bookings/cancel/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) window.location.reload();
        else alert('Failed to cancel booking');
    } catch (e) {
        console.error(e);
    }
};

window.cancelCab = async (id) => {
    if (!confirm('Are you sure you want to cancel this cab?')) return;
    try {
        const res = await fetch(`${API_BASE}/cabs/cancel/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) window.location.reload();
        else alert('Failed to cancel cab');
    } catch (e) {
        console.error(e);
    }
};
