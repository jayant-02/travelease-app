const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { bookTicket, getMyBookings, cancelBooking } = require('../controllers/bookingsController');

// Protected routes (sirf logged in users ke liye)
router.post('/', auth, bookTicket);
router.get('/my', auth, getMyBookings);
router.put('/cancel/:id', auth, cancelBooking);

module.exports = router;
