/*
  results.js — Dynamic Search Results Page
  This script runs on results.html.
  It reads the URL parameters (origin, destination, date, type),
  calls the backend API to fetch matching routes, and renders
  Yeh script results.html pe chalti hai.
  Yeh URL parameters (origin, destination, date, type) ko read karti hai,
  backend API ko call karke routes fetch karti hai, aur cards ko dynamically render karti hai.
  Filter tabs (All / Bus / Train) click karne par API se fir se data fetch hota hai,
  isliye filtering SERVER side par hoti hai.
*/

document.addEventListener('DOMContentLoaded', () => {
    // URL se search parameters nikal lo
    const params = new URLSearchParams(window.location.search);
    const origin = params.get('origin');
    const destination = params.get('destination');
    const date = params.get('date');
    const type = params.get('type');

    // Agar zaruri params missing hain, toh message dikhao
    if (!origin || !destination) {
        document.getElementById('resultsContainer').innerHTML = `
            <div class="no-results">
                <h3>Koi search parameters nahi mile</h3>
                <p>Kripya homepage par wapas jaayen aur ek route search karein.</p>
                <a href="index.html" class="btn-book" style="display:inline-block;margin-top:16px;">← Wapas Home</a>
            </div>
        `;
        return;
    }

    // Page ka heading update karo
    document.getElementById('routeTitle').textContent = `${origin} → ${destination}`;

    // URL param ke hisaab se active filter tab set karo
    if (type === 'bus') {
        document.getElementById('filter-bus').checked = true;
    } else if (type === 'train') {
        document.getElementById('filter-train').checked = true;
    } else {
        document.getElementById('filter-all').checked = true;
    }

    // Results fetch karna shuru karo
    fetchResults(origin, destination, type);

    // ── Filter tab change listeners ──
    // Jab user Bus/Train/All click kare, tab naye filter ke saath API se fetch karo
    document.querySelectorAll('.results-filter input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            fetchResults(origin, destination, e.target.value);

            // Page refresh kiye bina URL update karo
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

// Backend API se routes fetch karo
async function fetchResults(origin, destination, type) {
    const container = document.getElementById('resultsContainer');
    const countEl = document.getElementById('resultCount');

    // Loading state dikhao
    container.innerHTML = '<div class="loading-state">🔍 Sabse acche routes dhoondh rahe hain...</div>';

    try {
        // Query parameters ke saath API URL banao
        let url = `${API_BASE}/routes/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
        if (type) url += `&type=${type}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // Result count text update karo
        countEl.textContent = `${data.count} route${data.count !== 1 ? 's' : ''} mile`;

        // Agar koi route nahi mila, toh empty state dikhao
        if (data.count === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>Koi routes nahi mile</h3>
                    <p>Hamein ${origin} se ${destination} tak koi ${type ? type : ''} nahi mili. Kuch aur search karke dekhein.</p>
                </div>
            `;
            return;
        }

        // Route cards render karo
        renderRouteCards(data.routes);

    } catch (err) {
        container.innerHTML = `
            <div class="no-results">
                <h3 style="color: #ef4444;">Connection Error</h3>
                <p>${err.message}. Check karein ki backend server chal raha hai ya nahi.</p>
            </div>
        `;
        countEl.textContent = 'Error';
    }
}

// API data se route cards ka HTML render karo
function renderRouteCards(routes) {
    const container = document.getElementById('resultsContainer');
    const date = new URLSearchParams(window.location.search).get('date');

    let html = '';

    // Har route ke liye card banao
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
                <button class="btn-book" onclick="window.location.href='seat-selection.html?routeId=${route.id}&date=${date}'">Abhi Book Karein</button>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}
