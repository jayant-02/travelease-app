const CabBooking = require('../models/CabBooking');

// Cab book karo
exports.bookCab = async (req, res) => {
  try {
    const { pickup, dropoff, cabType, bookingId } = req.body;
    
    // Random distance lo (5 se 25 km) fare estimate ke liye
    const distance = Math.floor(Math.random() * 21) + 5; 
    
    let estimatedFare = 0;
    if (cabType === 'mini') {
      estimatedFare = 50 + (8 * distance);
    } else if (cabType === 'sedan') {
      estimatedFare = 80 + (12 * distance);
    } else if (cabType === 'suv') {
      estimatedFare = 120 + (16 * distance);
    } else {
      return res.status(400).json({ error: 'Invalid cab type' });
    }
    
    const cabBooking = new CabBooking({
      userId: req.user.id,
      bookingId: bookingId || null,
      pickup,
      dropoff,
      cabType,
      estimatedFare
    });
    
    await cabBooking.save();
    res.status(201).json(cabBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// User ki khudki cab bookings laao
exports.getMyCabBookings = async (req, res) => {
  try {
    const cabBookings = await CabBooking.find({ userId: req.user.id })
      .populate('bookingId')
      .sort({ bookedAt: -1 });
      
    res.json(cabBookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Cab booking cancel karo
exports.cancelCabBooking = async (req, res) => {
  try {
    const cabBooking = await CabBooking.findById(req.params.id);
    if (!cabBooking) return res.status(404).json({ error: 'Cab booking not found' });
    
    // Verify ownership
    if (cabBooking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (cabBooking.status === 'cancelled') {
      return res.status(400).json({ error: 'Already cancelled' });
    }
    
    cabBooking.status = 'cancelled';
    await cabBooking.save();
    
    res.json({ message: 'Cab booking cancelled successfully', cabBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
