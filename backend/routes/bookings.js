const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Book tickets for a route
// @access  Private (Requires login)
router.post('/', protect, (req, res) => {
    const { route_id, travel_date, seats } = req.body;
    const db = req.app.locals.db;
    const user_id = req.user.id;

    if (!route_id || !travel_date || !seats) {
        return res.status(400).json({ message: 'Please provide route_id, travel_date, and number of seats.' });
    }

    try {
        // 1. Get the route to verify it exists and check price
        const routeStmt = db.prepare('SELECT price, transport_type FROM routes WHERE id = ?');
        routeStmt.bind([route_id]);
        
        if (!routeStmt.step()) {
            routeStmt.free();
            return res.status(404).json({ message: 'The selected route could not be found.' });
        }
        
        const route = routeStmt.getAsObject();
        routeStmt.free();

        // 2. Calculate total price
        const total_price = route.price * seats;

        // 3. Create the booking
        const bookStmt = db.prepare(`
            INSERT INTO bookings (user_id, route_id, travel_date, seats, total_price)
            VALUES (?, ?, ?, ?, ?)
        `);
        bookStmt.run([user_id, route_id, travel_date, seats, total_price]);
        bookStmt.free();
        
        // 4. Get the ID of the newly created booking
        const idStmt = db.prepare('SELECT last_insert_rowid() as id');
        idStmt.step();
        const newBookingId = idStmt.getAsObject().id;
        idStmt.free();
        
        db.save();

        // 5. Fetch full booking details to return to the user
        const getBookingStmt = db.prepare(`
            SELECT b.id as booking_id, b.travel_date, b.seats, b.total_price, b.status, b.booked_at,
                   r.operator_name, r.transport_type, r.vehicle_type, r.origin, r.destination, r.departure_time, r.arrival_time, r.duration
            FROM bookings b
            JOIN routes r ON b.route_id = r.id
            WHERE b.id = ?
        `);
        getBookingStmt.bind([newBookingId]);
        getBookingStmt.step();
        const fullBooking = getBookingStmt.getAsObject();
        getBookingStmt.free();

        const typeWord = route.transport_type === 'bus' ? 'bus' : 'train';

        res.status(201).json({
            message: `Booking confirmed! Your ${typeWord} ticket is ready.`,
            booking: fullBooking
        });

    } catch (err) {
        res.status(500).json({ message: 'Error processing your booking.', error: err.message });
    }
});

// @route   GET /api/bookings/my
// @desc    Get logged-in user's bookings
// @access  Private
router.get('/my', protect, (req, res) => {
    const db = req.app.locals.db;
    
    try {
        const stmt = db.prepare(`
            SELECT b.id as booking_id, b.travel_date, b.seats, b.total_price, b.status, b.booked_at,
                   r.operator_name, r.transport_type, r.vehicle_type, r.origin, r.destination, r.departure_time, r.arrival_time, r.duration
            FROM bookings b
            JOIN routes r ON b.route_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.booked_at DESC
        `);
        stmt.bind([req.user.id]);
        
        const bookings = [];
        while (stmt.step()) {
            bookings.push(stmt.getAsObject());
        }
        stmt.free();

        res.json({
            count: bookings.length,
            bookings
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching your bookings.', error: err.message });
    }
});

// @route   GET /api/bookings
// @desc    Get all bookings (Admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), (req, res) => {
    const db = req.app.locals.db;
    
    try {
        const stmt = db.prepare(`
            SELECT b.id as booking_id, u.username, u.email, b.travel_date, b.seats, b.total_price, b.status,
                   r.operator_name, r.origin, r.destination
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN routes r ON b.route_id = r.id
            ORDER BY b.booked_at DESC
        `);
        
        const bookings = [];
        while (stmt.step()) {
            bookings.push(stmt.getAsObject());
        }
        stmt.free();

        res.json({
            count: bookings.length,
            bookings
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching all bookings.', error: err.message });
    }
});

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.patch('/:id/cancel', protect, (req, res) => {
    const db = req.app.locals.db;
    const booking_id = req.params.id;
    
    try {
        // First check if booking belongs to user
        const checkStmt = db.prepare('SELECT user_id, status FROM bookings WHERE id = ?');
        checkStmt.bind([booking_id]);
        
        if (!checkStmt.step()) {
            checkStmt.free();
            return res.status(404).json({ message: 'Booking not found.' });
        }
        
        const booking = checkStmt.getAsObject();
        checkStmt.free();

        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only cancel your own bookings.' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'This booking is already cancelled.' });
        }

        const updateStmt = db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
        updateStmt.run([booking_id]);
        updateStmt.free();
        db.save();

        res.json({
            message: 'Booking cancelled successfully. We hope to see you travel with us again!',
            booking_id,
            status: 'cancelled'
        });

    } catch (err) {
        res.status(500).json({ message: 'Error cancelling booking.', error: err.message });
    }
});

module.exports = router;
