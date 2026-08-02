let currentRoute = null;
let selectedSeats = [];
const MAX_SEATS = 6;
let routeDate = '';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const routeId = urlParams.get('routeId');
    routeDate = urlParams.get('date');

    if (!routeId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/routes/${routeId}`);
        currentRoute = await response.json();
        
        populateRouteInfo();
        generateSeatGrid();
    } catch (error) {
        console.error('Error loading route:', error);
    }
});

// Route info panel bharna
const populateRouteInfo = () => {
    document.getElementById('routeTitle').textContent = `${currentRoute.origin} to ${currentRoute.destination}`;
    document.getElementById('operatorName').textContent = currentRoute.operator;
    document.getElementById('vehicleType').textContent = currentRoute.vehicleType;
    document.getElementById('depTime').textContent = currentRoute.departureTime;
    document.getElementById('arrTime').textContent = currentRoute.arrivalTime;
    document.getElementById('travelDate').textContent = routeDate;
};

// Seat grid banano based on route type
const generateSeatGrid = () => {
    const container = document.getElementById('seatGrid');
    container.innerHTML = '';
    
    const isTrain = currentRoute.totalSeats > 52;
    const total = currentRoute.totalSeats;
    
    // Dummy randomly taken seats (~20%)
    const takenSeats = new Set();
    while(takenSeats.size < Math.floor(total * 0.2)) {
        takenSeats.add(Math.floor(Math.random() * total) + 1);
    }

    if (!isTrain) {
        // Bus layout: 2+2
        container.classList.add('bus-layout');
        let rowHtml = '';
        for (let i = 1; i <= total; i++) {
            const isTaken = takenSeats.has(i);
            const seatClass = isTaken ? 'seat taken' : 'seat available';
            
            rowHtml += `<div class="${seatClass}" data-seat="${i}" ${isTaken ? '' : `onclick="toggleSeat(${i})"`}>${i}</div>`;
            
            if (i % 2 === 0 && i % 4 !== 0) {
                rowHtml += `<div class="aisle"></div>`; // Aisle gap
            }
            
            if (i % 4 === 0) {
                container.innerHTML += `<div class="seat-row">${rowHtml}</div>`;
                rowHtml = '';
            }
        }
        if (rowHtml) container.innerHTML += `<div class="seat-row">${rowHtml}</div>`;
    } else {
        // Train layout: row of 6
        container.classList.add('train-layout');
        let rowHtml = '';
        for (let i = 1; i <= total; i++) {
            const isTaken = takenSeats.has(i);
            const seatClass = isTaken ? 'seat taken' : 'seat available';
            
            rowHtml += `<div class="${seatClass}" data-seat="${i}" ${isTaken ? '' : `onclick="toggleSeat(${i})"`}>${i}</div>`;
            
            if (i % 6 === 0) {
                container.innerHTML += `<div class="seat-row">${rowHtml}</div>`;
                rowHtml = '';
            }
        }
        if (rowHtml) container.innerHTML += `<div class="seat-row">${rowHtml}</div>`;
    }
};

// Seat select/deselect logic
window.toggleSeat = (seatNum) => {
    const seatEl = document.querySelector(`.seat[data-seat="${seatNum}"]`);
    
    if (selectedSeats.includes(seatNum)) {
        selectedSeats = selectedSeats.filter(s => s !== seatNum);
        seatEl.classList.remove('selected');
        seatEl.classList.add('available');
    } else {
        if (selectedSeats.length >= MAX_SEATS) {
            alert(`You can only select up to ${MAX_SEATS} seats.`);
            return;
        }
        selectedSeats.push(seatNum);
        seatEl.classList.remove('available');
        seatEl.classList.add('selected');
    }
    
    updateSummary();
};

// Summary aur price update karo
const updateSummary = () => {
    const seatListEl = document.getElementById('selectedSeatList');
    const totalEl = document.getElementById('totalPrice');
    const proceedBtn = document.getElementById('proceedBtn');
    
    if (selectedSeats.length === 0) {
        seatListEl.textContent = 'None';
        totalEl.textContent = '₹0';
        proceedBtn.disabled = true;
    } else {
        seatListEl.textContent = selectedSeats.join(', ');
        totalEl.textContent = `₹${selectedSeats.length * currentRoute.price}`;
        proceedBtn.disabled = false;
    }
};

// Booking confirm karo
window.confirmBooking = async () => {
    if (!currentUser) {
        // User logged in nahi hai toh auth modal dikhao
        window.onAuthSuccess = () => confirmBooking();
        openAuthModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                routeId: currentRoute._id,
                travelDate: routeDate,
                seats: selectedSeats.length
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        // Success message and Cab CTA
        document.getElementById('bookingPanel').innerHTML = `
            <div class="success-message text-center">
                <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                <h3>Booking Confirmed!</h3>
                <p>Your tickets have been booked successfully.</p>
                <div class="mt-4">
                    <a href="bookings.html" class="btn btn-outline">View Tickets</a>
                    <a href="cab-booking.html?pickup=${currentRoute.destination}&bookingId=${data._id}" class="btn btn-primary mt-2">Book a Cab from Station</a>
                </div>
            </div>
        `;
    } catch (error) {
        alert(`Booking failed: ${error.message}`);
    }
};
