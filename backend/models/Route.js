const mongoose = require('mongoose');

// Route (travel route) ki details
const routeSchema = new mongoose.Schema({
  operatorName: { type: String, required: true },
  transportType: { type: String, enum: ['bus', 'train'], required: true },
  vehicleType: { type: String, required: true }, // e.g., 'AC Sleeper', 'Express'
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  duration: { type: String, required: true },
  price: { type: Number, required: true },
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
