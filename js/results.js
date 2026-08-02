document.addEventListener('DOMContentLoaded', () => {
    // URL params read karo
    const urlParams = new URLSearchParams(window.location.search);
    const origin = urlParams.get('origin');
    const destination = urlParams.get('destination');
    const date = urlParams.get('date');
    const type = urlParams.get('type') || 'bus';

    if (!origin || !destination || !date) {
        document.getElementById('resultsContainer').innerHTML = `
            <div class="empty-state">
                <h3>Missing Information</h3>
                <p>Please go back and enter origin, destination, and date.</p>
                <a href="index.html" class="btn btn-primary">Go Back</a>
            </div>
        `;
        return;
    }

    // Title update karo
    const routeTitle = document.getElementById('routeTitle');
    if (routeTitle) routeTitle.textContent = `${origin} to ${destination}`;
    
    // Active tab set karo
    document.querySelectorAll('.filter-tab').forEach(tab => {
        if(tab.dataset.type === type) tab.classList.add('active');
        else tab.classList.remove('active');
        
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            fetchResults(origin, destination, e.target.dataset.type, date);
        });
    });

    fetchResults(origin, destination, type, date);
    fetchWeather(destination);
});

// Results fetch karo API se
const fetchResults = async (origin, dest, type, date) => {
    const container = document.getElementById('resultsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading routes...</div>';

    try {
        const response = await fetch(`${API_BASE}/routes/search?origin=${origin}&destination=${dest}&type=${type}`);
        const routes = await response.json();

        if (routes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Routes Found</h3>
                    <p>Sorry, we couldn't find any ${type}s from ${origin} to ${dest}.</p>
                </div>`;
            document.getElementById('resultCount').textContent = '0';
            return;
        }

        renderRouteCards(routes, date);
        document.getElementById('resultCount').textContent = routes.length.toString();
    } catch (error) {
        container.innerHTML = `<div class="error-state">Error fetching routes: ${error.message}</div>`;
    }
};

// Route cards render karo
const renderRouteCards = (routes, date) => {
    const container = document.getElementById('resultsList');
    container.innerHTML = '';

    // Smart badges ke liye calculations
    const minPrice = Math.min(...routes.map(r => r.price));
    const maxRating = Math.max(...routes.map(r => r.rating || 0));

    routes.forEach(route => {
        let badgesHTML = '';
        if (route.price === minPrice) badgesHTML += `<span class="badge badge-success">Best Price</span> `;
        if (route.rating === maxRating && maxRating > 0) badgesHTML += `<span class="badge badge-warning">Most Popular</span>`;

        const card = document.createElement('div');
        card.className = 'route-card';
        card.innerHTML = `
            <div class="route-header">
                <div class="operator-info">
                    <h3>${route.operator}</h3>
                    <span class="vehicle-type">${route.vehicleType}</span>
                </div>
                <div class="badges">${badgesHTML}</div>
            </div>
            
            <div class="route-body">
                <div class="time-location">
                    <div class="time">${route.departureTime}</div>
                    <div class="location">${route.origin}</div>
                </div>
                
                <div class="duration-connector">
                    <span class="duration">${route.duration}</span>
                    <div class="line"></div>
                </div>
                
                <div class="time-location text-right">
                    <div class="time">${route.arrivalTime}</div>
                    <div class="location">${route.destination}</div>
                </div>
            </div>
            
            <div class="route-footer">
                <div class="rating-price">
                    ${route.rating ? `<div class="rating"><i class="fas fa-star"></i> ${route.rating}</div>` : ''}
                    <div class="price">₹${route.price}</div>
                </div>
                <a href="seat-selection.html?routeId=${route._id}&date=${date}" class="btn btn-primary">Book Now</a>
            </div>
        `;
        container.appendChild(card);
    });
};

// Weather fetch karo
const fetchWeather = async (city) => {
    const weatherWidget = document.getElementById('weatherWidget');
    if (!weatherWidget) return;
    
    try {
        const response = await fetch(`https://wttr.in/${city}?format=j1`);
        const data = await response.json();
        const current = data.current_condition[0];
        
        weatherWidget.innerHTML = `
            <div class="weather-info">
                <span class="temp">${current.temp_C}°C</span>
                <span class="condition">${current.weatherDesc[0].value} in ${city}</span>
            </div>
        `;
    } catch (error) {
        console.error('Weather fetch error:', error);
        weatherWidget.style.display = 'none';
    }
};
