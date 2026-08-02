const Route = require('../models/Route');

// Routes search karo (origin and destination se)
exports.searchRoutes = async (req, res) => {
  try {
    const { origin, destination, type } = req.query;
    let query = {};
    
    if (origin) query.origin = new RegExp(origin, 'i'); // case-insensitive
    if (destination) query.destination = new RegExp(destination, 'i');
    if (type) query.transportType = type;

    const routes = await Route.find(query);
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Route by ID dhoondho
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Sab cities ke names nikalte hain, unique aur sorted
exports.getCities = async (req, res) => {
  try {
    const origins = await Route.distinct('origin');
    const destinations = await Route.distinct('destination');
    
    // Set ka use karke duplicate hata do
    const cities = [...new Set([...origins, ...destinations])].sort();
    res.json(cities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
