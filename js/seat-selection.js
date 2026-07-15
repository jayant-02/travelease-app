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

// URL se details nikalo
const urlParams = new URLSearchParams(window.location.search);
const routeId = urlParams.get('routeId');
const travelDate = urlParams.get('date');

let routeData = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!routeId) {
        document.querySelector('.seat-wrapper').innerHTML = `
            <div class="no-results" style="width:100%; text-align:center;">
                <h3>Missing Information</h3>
                <p>Please go back and select a route from the search results.</p>
                <a href="index.html" class="btn-book" style="display:inline-block;margin-top:16px;">← Go Home</a>
            </div>
        `;
        return;
    }
    fetchRouteDetails();
});

// Backend se is route ki detail le aao
async function fetchRouteDetails() {
    try {
        const res = await fetch(`${API_BASE}/routes/${routeId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        routeData = data;
        
        // Populate the left panel with route details
        document.getElementById('opName').textContent = routeData.operator_name;

        const badge = document.getElementById('transportBadge');
        badge.textContent = routeData.transport_type.charAt(0).toUpperCase() + routeData.transport_type.slice(1);
        badge.className = `badge ${routeData.transport_type === 'bus' ? 'badge-bus' : 'badge-train'}`;

        document.getElementById('tripOrigin').textContent = routeData.origin;
        document.getElementById('tripDest').textContent = routeData.destination;
        document.getElementById('tripDepTime').textContent = routeData.departure_time;
        document.getElementById('tripArrTime').textContent = routeData.arrival_time;

        document.getElementById('detailDuration').textContent = routeData.duration;
        document.getElementById('detailPrice').textContent = `₹${routeData.price}`;
        document.getElementById('detailVehicle').textContent = routeData.vehicle_type;

        // Simulate some seats being already taken
        markTakenSeats(parseInt(routeId));
        attachSeatListeners();
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

// Seat select/deselect par summary update karo
function attachSeatListeners() {
    const checkboxes = document.querySelectorAll('.seat-cb');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateSummary);
    });
}

function updateSummary() {
    const selected = document.querySelectorAll('.seat-cb:checked:not(:disabled)');
    const count = selected.length;
    const total = count * routeData.price;
    
    document.getElementById('selectedSeats').textContent = count > 0 ? count : '—';
    document.getElementById('totalPrice').textContent = `₹${total}`;
    
    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) proceedBtn.disabled = count === 0;
}

// Jab user Confirm Booking dabaye
document.getElementById('proceedBtn').addEventListener('click', () => {
    const selected = document.querySelectorAll('.seat-cb:checked:not(:disabled)');
    
    // Login nahi kiya hai toh modal kholo aur process rok do
    if (!getToken()) {
        openAuthModal();
        return;
    }

    // Login hai toh aage badho
    processBooking(selected.length);
});

// Login success hone pe apne aap booking start kardo
window.onAuthSuccess = function () {
    const selected = document.querySelectorAll('.seat-cb:checked:not(:disabled)');
    if (selected.length > 0) {
        processBooking(selected.length);
    }
};

// Booking request bhejo
async function processBooking(seatCount) {
    const btn = document.getElementById('proceedBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
        const payload = {
            route_id: routeData.id,
            travel_date: travelDate,
            seats: seatCount
        };

        const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Booking successful! My Bookings page pe le jao
        alert('🎉 ' + data.message);
        window.location.href = 'bookings.html';
        
    } catch (err) {
        alert('Booking failed: ' + err.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
