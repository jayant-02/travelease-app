const mongoose = require('mongoose');

// Cab bookings ka model
const cabBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // optional
  pickup: { type: String, required: true },
  dropoff: { type: String, required: true },
  cabType: { type: String, enum: ['mini', 'sedan', 'suv'], required: true },
  estimatedFare: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  bookedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CabBooking', cabBookingSchema);
