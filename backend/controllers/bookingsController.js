const Booking = require('../models/Booking');
const Route = require('../models/Route');

// Ticket book karo
exports.bookTicket = async (req, res) => {
  try {
    const { routeId, travelDate, seats } = req.body;
    
    // Route check karo
    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    
    // Seat availability check
    if (route.availableSeats < seats) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    const totalPrice = route.price * seats;
    
    // Booking create karo
    const booking = new Booking({
      userId: req.user.id,
      routeId,
      travelDate,
      seats,
      totalPrice
    });
    
    await booking.save();
    
    // Available seats decrement karo
    route.availableSeats -= seats;
    await route.save();
    
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// User ki khudki bookings laao
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('routeId')
      .sort({ bookedAt: -1 }); // Newest pehle
      
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Booking cancel karo
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    // Ownership check karo
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Already cancelled' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    // Route me seats waapas add karo
    const route = await Route.findById(booking.routeId);
    if (route) {
      route.availableSeats += booking.seats;
      await route.save();
    }
    
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
