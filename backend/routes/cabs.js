const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { bookCab, getMyCabBookings, cancelCabBooking } = require('../controllers/cabController');

// Protected cab routes
router.post('/', auth, bookCab);
router.get('/my', auth, getMyCabBookings);
router.put('/cancel/:id', auth, cancelCabBooking);

module.exports = router;
