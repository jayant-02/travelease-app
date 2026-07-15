const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { bookTicket, getMyBookings, cancelBooking } = require('../controllers/bookingsController');

router.post('/', protect, bookTicket);
router.get('/my', protect, getMyBookings);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
