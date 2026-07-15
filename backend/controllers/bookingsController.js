const { getDB, saveDB } = require('../database/init');

// Naya ticket book karne ka logic
const bookTicket = (req, res) => {
    const { route_id, travel_date, seats } = req.body;
    const user_id = req.user.id; // Auth middleware se nikalenge user ID

    if (!route_id || !travel_date || !seats) {
        return res.status(400).json({ message: 'Missing required booking details.' });
    }

    try {
        const db = getDB();
        
        // Route dhoondho taaki price calculate kar sakein aur seats check ho jayein
        const route = db.routes.find(r => r.id === parseInt(route_id));

        if (!route) {
            return res.status(404).json({ message: 'Route not found.' });
        }

        if (route.available_seats < seats) {
            return res.status(400).json({ message: 'Not enough seats available.' });
        }

        const total_price = route.price * seats;

        const newBooking = {
            id: db._nextIds.bookings++,
            user_id,
            route_id: parseInt(route_id),
            travel_date,
            seats: parseInt(seats),
            total_price,
            status: 'confirmed',
            booked_at: new Date().toISOString()
        };

        // Database array mein nayi booking daal do
        db.bookings.push(newBooking);

        // Nayi booking hone ke baad, bachi hui seats ko route me update kardo
        route.available_seats -= seats;

        saveDB(db);

        res.status(201).json({ 
            message: 'Booking confirmed successfully!',
            booking_id: newBooking.id
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to process booking.', error: err.message });
    }
};

// Logged-in user ki saari bookings fetch karo
const getMyBookings = (req, res) => {
    const user_id = req.user.id;

    try {
        const db = getDB();
        
        const userBookings = db.bookings
            .filter(b => b.user_id === user_id)
            .map(b => {
                // Route ka data iske sath mix kardo
                const route = db.routes.find(r => r.id === b.route_id) || {};
                
                return {
                    booking_id: b.id,
                    travel_date: b.travel_date,
                    seats: b.seats,
                    total_price: b.total_price,
                    status: b.status,
                    booked_at: b.booked_at,
                    operator_name: route.operator_name || 'Unknown',
                    transport_type: route.transport_type || 'Unknown',
                    vehicle_type: route.vehicle_type || 'Unknown',
                    origin: route.origin || 'Unknown',
                    destination: route.destination || 'Unknown',
                    departure_time: route.departure_time || 'Unknown',
                    arrival_time: route.arrival_time || 'Unknown',
                    duration: route.duration || 'Unknown'
                };
            });

        // Sabse nayi booking upar dikhani chahiye
        userBookings.sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));

        res.json({
            count: userBookings.length,
            bookings: userBookings
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch bookings.', error: err.message });
    }
};

// Cancel booking wala part
const cancelBooking = (req, res) => {
    const booking_id = req.params.id;
    const user_id = req.user.id;

    try {
        const db = getDB();
        
        const booking = db.bookings.find(b => b.id === parseInt(booking_id));

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (booking.user_id !== user_id) {
            return res.status(403).json({ message: 'You do not have permission to cancel this booking.' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled.' });
        }

        // Status ko update kardo
        booking.status = 'cancelled';

        // Seats waapas route ko dedo
        const route = db.routes.find(r => r.id === booking.route_id);
        if (route) {
            route.available_seats += booking.seats;
        }

        saveDB(db);

        res.json({ message: 'Booking cancelled successfully. Your refund will be initiated shortly.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to cancel booking.', error: err.message });
    }
};

module.exports = { bookTicket, getMyBookings, cancelBooking };
