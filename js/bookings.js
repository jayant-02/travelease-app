/*
  bookings.js — My Bookings Page Logic
  Fetches the logged-in user's booking history from the API
  and renders booking cards. Also handles ticket cancellation.
*/

document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for main.js to initialize auth
    setTimeout(() => {
        if (!getToken()) {
            // Not logged in — redirect to home
            window.location.href = 'index.html';
            return;
        }
        fetchBookings();
    }, 150);
});


// Fetch user's bookings from API
async function fetchBookings() {
    const listEl = document.getElementById('bookingsList');

    try {
        const res = await fetch(`${API_BASE}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        if (data.count === 0) {
            listEl.innerHTML = `
                <div class="no-results">
                    <h3>No Bookings Yet</h3>
                    <p>You haven't booked any tickets yet. Go explore some routes!</p>
                    <a href="index.html" class="btn-book" style="display:inline-block;margin-top:16px;">← Search Routes</a>
                </div>
            `;
            return;
        }

        let html = '';
        data.bookings.forEach(booking => {
            const isConfirmed = booking.status === 'confirmed';
            const statusClass = isConfirmed ? 'status-confirmed' : 'status-cancelled';

            html += `
            <div class="booking-card">
                <div>
                    <div class="booking-route">${booking.origin} → ${booking.destination}</div>
                    <div class="booking-details">
                        ${booking.operator_name} · ${booking.vehicle_type}<br>
                        📅 ${booking.travel_date} · ${booking.departure_time} → ${booking.arrival_time}<br>
                        🪑 ${booking.seats} seat(s) · ${booking.duration}
                    </div>
                    <span class="booking-status ${statusClass}">${booking.status}</span>
                </div>
                <div style="text-align:right;">
                    <div class="booking-price">₹${booking.total_price}</div>
                    ${isConfirmed ? `<button class="btn-cancel" onclick="cancelBooking(${booking.booking_id})">Cancel Ticket</button>` : ''}
                </div>
            </div>
            `;
        });

        listEl.innerHTML = html;

    } catch (err) {
        listEl.innerHTML = `
            <div class="no-results">
                <h3 style="color:#ef4444;">Error</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}


// Cancel a booking
async function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
        const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        alert(data.message);
        fetchBookings(); // Refresh the list

    } catch (err) {
        alert('Failed to cancel: ' + err.message);
    }
}
