/*
  seat-selection.js — Seat Selection & Booking Logic
  This script runs on seat-selection.html.
  FLOW:
  1. Read routeId and date from URL parameters
  2. Fetch route details from the backend API
  3. Populate the trip info panel with real data
  4. Randomly mark some seats as "taken" (for demo purposes)
  5. Track seat selection and update the total price
  6. On "Proceed to Pay", call the booking API
  7. If user is not logged in, show auth modal first
*/

let currentRoute = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const routeId = params.get('routeId');
    const date = params.get('date');

    // Validate we have the needed params
    if (!routeId || !date) {
        document.querySelector('.seat-wrapper').innerHTML = `
            <div class="no-results" style="width:100%; text-align:center;">
                <h3>Missing Information</h3>
                <p>Please go back and select a route from the search results.</p>
                <a href="index.html" class="btn-book" style="display:inline-block;margin-top:16px;">← Go Home</a>
            </div>
        `;
        return;
    }

    // Set the "Back to Results" link
    const backBtn = document.getElementById('backBtn');
    const lastOrigin = localStorage.getItem('last_origin') || '';
    const lastDest = localStorage.getItem('last_dest') || '';
    if (backBtn) {
        backBtn.href = `results.html?origin=${encodeURIComponent(lastOrigin)}&destination=${encodeURIComponent(lastDest)}&date=${date}`;
    }

    // Fetch route details and set up seat selection
    fetchRouteDetails(routeId);
    setupSeatListeners();
});


// Fetch route details from backend
async function fetchRouteDetails(routeId) {
    try {
        const res = await fetch(`${API_BASE}/routes/${routeId}`);
        const route = await res.json();

        if (!res.ok) throw new Error(route.message);

        currentRoute = route;

        // Populate the left panel with route details
        document.getElementById('opName').textContent = route.operator_name;

        const badge = document.getElementById('transportBadge');
        badge.textContent = route.transport_type.charAt(0).toUpperCase() + route.transport_type.slice(1);
        badge.className = `badge ${route.transport_type === 'bus' ? 'badge-bus' : 'badge-train'}`;

        document.getElementById('tripOrigin').textContent = route.origin;
        document.getElementById('tripDest').textContent = route.destination;
        document.getElementById('tripDepTime').textContent = route.departure_time;
        document.getElementById('tripArrTime').textContent = route.arrival_time;

        document.getElementById('detailDuration').textContent = route.duration;
        document.getElementById('detailPrice').textContent = `₹${route.price}`;
        document.getElementById('detailVehicle').textContent = route.vehicle_type;

        // Simulate some seats being already taken
        // We use a simple hash based on route ID so it's consistent per route
        markTakenSeats(parseInt(routeId));

    } catch (err) {
        document.querySelector('.seat-wrapper').innerHTML = `
            <div class="no-results" style="width:100%; text-align:center;">
                <h3 style="color:#ef4444;">Error</h3>
                <p>${err.message}. Make sure the backend server is running.</p>
            </div>
        `;
    }
}


// Mark some seats as "taken" based on route ID
function markTakenSeats(routeId) {
    const seed = routeId * 7 + 3;
    document.querySelectorAll('.seat-cb').forEach((cb, index) => {
        // Simple pseudo-random pattern based on seat index and route ID
        if ((index * seed) % 11 === 0 || (index * seed + 5) % 13 === 0) {
            cb.disabled = true;
            cb.nextElementSibling.classList.add('taken');
        }
    });
}


// Set up seat click listeners
function setupSeatListeners() {
    const checkboxes = document.querySelectorAll('.seat-cb');
    const selectedEl = document.getElementById('selectedSeats');
    const totalEl = document.getElementById('totalPrice');

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const count = document.querySelectorAll('.seat-cb:checked:not(:disabled)').length;

            if (count > 0 && currentRoute) {
                selectedEl.textContent = count;
                totalEl.textContent = `₹${count * currentRoute.price}`;
            } else {
                selectedEl.textContent = '—';
                totalEl.textContent = '₹0';
            }
        });
    });
}


// Proceed to Pay
function handleProceed() {
    const selected = document.querySelectorAll('.seat-cb:checked:not(:disabled)');

    if (selected.length === 0) {
        alert('Please select at least one seat.');
        return;
    }

    // If not logged in, show auth modal and retry after login
    if (!getToken()) {
        openAuthModal();
        return;
    }

    processBooking(selected.length);
}

// This callback is called by main.js after successful login
window.onAuthSuccess = function () {
    const selected = document.querySelectorAll('.seat-cb:checked:not(:disabled)');
    if (selected.length > 0) {
        processBooking(selected.length);
    }
};


// Call the booking API
async function processBooking(seatCount) {
    const btn = document.getElementById('proceedBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Booking...';
    btn.disabled = true;

    const params = new URLSearchParams(window.location.search);
    const travelDate = params.get('date');

    try {
        const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                route_id: currentRoute.id,
                travel_date: travelDate,
                seats: seatCount
            })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Booking successful — redirect to bookings page
        alert('🎉 ' + data.message);
        window.location.href = 'bookings.html';

    } catch (err) {
        alert('Booking failed: ' + err.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
