/*
  results.js — Dynamic Search Results Page
  This script runs on results.html.
  It reads the URL parameters (origin, destination, date, type),
  calls the backend API to fetch matching routes, and renders
  the route cards dynamically.
  The filter tabs (All / Bus / Train) re-fetch from the API
  when clicked, so filtering is done on the SERVER side.
*/

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const origin = params.get('origin');
    const destination = params.get('destination');
    const date = params.get('date');
    const type = params.get('type');

    // If essential params are missing, show a helpful message
    if (!origin || !destination) {
        document.getElementById('resultsContainer').innerHTML = `
            <div class="no-results">
                <h3>No search parameters</h3>
                <p>Please go back to the homepage and search for a route.</p>
                <a href="index.html" class="btn-book" style="display:inline-block;margin-top:16px;">← Go Home</a>
            </div>
        `;
        return;
    }

    // Update the page heading with the route
    document.getElementById('routeTitle').textContent = `${origin} → ${destination}`;

    // Set the active filter tab based on URL param
    if (type === 'bus') {
        document.getElementById('filter-bus').checked = true;
    } else if (type === 'train') {
        document.getElementById('filter-train').checked = true;
    } else {
        document.getElementById('filter-all').checked = true;
    }

    // Fetch initial results
    fetchResults(origin, destination, type);

    // ── Filter tab change listeners ──
    // When user clicks Bus/Train/All, re-fetch from API with the new filter
    document.querySelectorAll('.results-filter input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            fetchResults(origin, destination, e.target.value);

            // Update URL without full page reload
            const newUrl = new URL(window.location);
            if (e.target.value) {
                newUrl.searchParams.set('type', e.target.value);
            } else {
                newUrl.searchParams.delete('type');
            }
            window.history.replaceState({}, '', newUrl);
        });
    });
});


// Fetch routes from the backend API
async function fetchResults(origin, destination, type) {
    const container = document.getElementById('resultsContainer');
    const countEl = document.getElementById('resultCount');

    // Show loading state
    container.innerHTML = '<div class="loading-state">🔍 Searching for the best routes...</div>';

    try {
        // Build the API URL with query parameters
        let url = `${API_BASE}/routes/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
        if (type) url += `&type=${type}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Update the result count text
        countEl.textContent = `${data.count} route${data.count !== 1 ? 's' : ''} found`;

        // If no routes found, show empty state
        if (data.count === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>No routes found</h3>
                    <p>We couldn't find any ${type ? type : ''} routes from ${origin} to ${destination}. Try a different search.</p>
                </div>
            `;
            return;
        }

        // Render route cards
        renderRouteCards(data.routes);

    } catch (err) {
        container.innerHTML = `
            <div class="no-results">
                <h3 style="color: #ef4444;">Connection Error</h3>
                <p>${err.message}. Make sure the backend server is running.</p>
            </div>
        `;
        countEl.textContent = 'Error';
    }
}


// Render route cards HTML from API data
function renderRouteCards(routes) {
    const container = document.getElementById('resultsContainer');
    const date = new URLSearchParams(window.location.search).get('date');

    let html = '';

    routes.forEach((route, i) => {
        const delay = `fade-up-d${(i % 6) + 1}`;
        const badgeClass = route.transport_type === 'bus' ? 'badge-bus' : 'badge-train';
        const badgeText = route.transport_type.charAt(0).toUpperCase() + route.transport_type.slice(1);

        html += `
        <div class="route-card fade-up ${delay}">
            <div class="route-operator">
                <h3>${route.operator_name} <span class="badge ${badgeClass}">${badgeText}</span></h3>
                <span class="route-vehicle">${route.vehicle_type}</span>
            </div>
            <div class="route-journey">
                <div class="route-point">
                    <div class="route-time">${route.departure_time}</div>
                    <div class="route-city">${route.origin}</div>
                </div>
                <div class="route-connector">
                    <div class="route-duration">${route.duration}</div>
                    <div class="route-line"></div>
                </div>
                <div class="route-point">
                    <div class="route-time">${route.arrival_time}</div>
                    <div class="route-city">${route.destination}</div>
                </div>
            </div>
            <div class="route-action">
                <div class="ticket-price">₹${route.price}</div>
                <button class="btn-book" onclick="window.location.href='seat-selection.html?routeId=${route.id}&date=${date}'">Book Now</button>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}
