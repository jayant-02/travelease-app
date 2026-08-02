const Route = require('../models/Route');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Dashboard stats laao
exports.getDashboard = async (req, res) => {
  try {
    const totalRoutes = await Route.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Sirf confirmed bookings ka revenue nikalo
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    const revenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    res.json({ totalRoutes, totalBookings, totalUsers, revenue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Saare routes laao
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Naya route add karo
exports.addRoute = async (req, res) => {
  try {
    // Ensure availableSeats is initially same as totalSeats if not provided
    if (req.body.totalSeats && req.body.availableSeats === undefined) {
        req.body.availableSeats = req.body.totalSeats;
    }
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Route update karo
exports.updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Route delete karo
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Saari bookings laao
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('routeId')
      .sort({ bookedAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Saare users laao (password chhodke)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
