/*
  bookings.js — My Bookings Page Logic
  Fetches the logged-in user's booking history from the API
  User ki booking history API se fetch karta hai aur cards render karta hai. Ticket cancellation bhi yahi handle hota hai.
*/

document.addEventListener('DOMContentLoaded', () => {
    // Thoda wait karo jab tak main.js auth initialize ho jaye
    setTimeout(() => {
        const token = getToken();

        // Agar token nahi hai, toh page access nahi karne do
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // Backend se bookings laao
        fetchBookings(token);
    }, 150);
});

// Fetch user's bookings from API
async function fetchBookings(token) {
    const listEl = document.getElementById('bookingsList');
    // Load dikhao
    listEl.innerHTML = '<div class="loading-state">Fetching your bookings...</div>';

    try {
        const res = await fetch(`${API_BASE}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // Agar koi booking nahi hai
        if (!data || data.count === 0) {
            listEl.innerHTML = `
                <div class="no-results">
                    <h3>Abhi tak koi bookings nahi!</h3>
                    <p>It looks like you have not booked any tickets yet. Explore some routes!</p>
                    <a href="index.html" class="btn-book" style="display:inline-block;margin-top:16px;">← Abhi Book Karein</a>
                </div>
            `;
            return;
        }

        // List saaf karo aur cards render karo
        let html = '';
        data.bookings.forEach(booking => {
            const isConfirmed = booking.status === 'confirmed';
            const statusClass = isConfirmed ? 'status-confirmed' : 'status-cancelled';

            html += `
            <div class="booking-card">
                <div>
                    <div class="booking-route">${booking.origin} → ${booking.destination}</div>
                    <div class="booking-details">
                    ${booking.operator_name || 'Unknown Operator'} · ${booking.vehicle_type || ''}<br>
                        Date: ${booking.travel_date} · ${booking.departure_time || ''} → ${booking.arrival_time || ''}<br>
                        Seats: ${booking.seats} · ${booking.duration || ''}
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
        // Agar error aaye
        listEl.innerHTML = `
            <div class="no-results" style="color:var(--coral);">
                <h3>Arey yaar!</h3>
                <p>Bookings load nahi ho paayin. Connection check karo: ${err.message}</p>
            </div>
        `;
    }
}

// Ticket cancel karne ka function
async function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel your ticket?')) return;

    const token = getToken();

    try {
        // Cancel API pe call karo
        const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // Cancel ho gaya
        alert('Booking cancel ho gayi! Refund jaldi hi process ho jayega.');
        
        // Nayi list manga lo
        fetchBookings(token); 

    } catch (err) {
        alert('Failed to cancel: ' + err.message);
    }
}
