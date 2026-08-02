let randomDistance = Math.floor(Math.random() * 20) + 5; // 5 to 25 km random distance
let bookingRefId = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pickupParam = urlParams.get('pickup');
    bookingRefId = urlParams.get('bookingId');
    
    if (pickupParam) {
        const pickupLocation = document.getElementById('pickupLocation');
        if (pickupLocation) pickupLocation.value = pickupParam;
    }

    // Event listeners for fare calculation
    document.querySelectorAll('input[name="cabType"]').forEach(radio => {
        radio.addEventListener('change', calculateFare);
    });
    const dropoffLocation = document.getElementById('dropoffLocation');
    if (dropoffLocation) {
        dropoffLocation.addEventListener('input', calculateFare);
    }
    
    calculateFare(); // Initial calculation
});

// Fare estimate calculate karo
const calculateFare = () => {
    const typeRadio = document.querySelector('input[name="cabType"]:checked');
    const dropoff = document.getElementById('dropoffLocation');
    
    if (!typeRadio || !dropoff) return;
    
    const type = typeRadio.value;
    const dropoffValue = dropoff.value;
    const fareEstimateEl = document.getElementById('fareEstimate');
    const fareAmountEl = document.getElementById('fareAmount');
    
    if (!dropoffValue.trim()) {
        if (fareEstimateEl) fareEstimateEl.style.display = 'none';
        return;
    }

    let baseFare = 0;
    let perKm = 0;

    switch(type) {
        case 'mini': baseFare = 50; perKm = 8; break;
        case 'sedan': baseFare = 80; perKm = 12; break;
        case 'suv': baseFare = 120; perKm = 16; break;
    }

    const totalFare = baseFare + (randomDistance * perKm);
    if (fareAmountEl) fareAmountEl.textContent = totalFare;
    if (fareEstimateEl) fareEstimateEl.style.display = 'block';
};

// Form submit handle karo
const cabBookingForm = document.getElementById('cabBookingForm');
if (cabBookingForm) {
    cabBookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!getToken()) {
            openAuthModal();
            return;
        }

        const pickup = document.getElementById('pickupLocation').value;
        const dropoff = document.getElementById('dropoffLocation').value;
        const cabType = document.querySelector('input[name="cabType"]:checked').value;
        const estimatedFare = parseInt(document.getElementById('fareAmount').textContent);

        try {
            const response = await fetch(`${API_BASE}/cabs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ pickup, dropoff, cabType, estimatedFare, bookingId: bookingRefId })
            });

            if (response.ok) {
                alert('Cab booked successfully!');
                window.location.href = 'bookings.html';
            } else {
                const data = await response.json();
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Cab booking failed:', error);
        }
    });
}
