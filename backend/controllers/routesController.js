const { getDB } = require('../database/init');

// Origin, destination aur type ke hisaab se route search karne ke liye
const searchRoutes = (req, res) => {
    let { origin, destination, type } = req.query;

    if (!origin || !destination) {
        return res.status(400).json({ message: 'Origin and destination are required' });
    }

    // Search string ko theek karlo (spaces hata do aur lowercase me kardo)
    origin = origin.trim().toLowerCase();
    destination = destination.trim().toLowerCase();

    try {
        const db = getDB();
        
        let results = db.routes.filter(r => 
            r.origin.toLowerCase() === origin && 
            r.destination.toLowerCase() === destination
        );

        if (type) {
            results = results.filter(r => r.transport_type === type.toLowerCase());
        }

        res.json({
            count: results.length,
            origin: req.query.origin, // Original format wapas bhejo
            destination: req.query.destination, // Original format wapas bhejo
            routes: results
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error while searching routes', error: err.message });
    }
};

// ID ke according single route le aao
const getRouteById = (req, res) => {
    const { id } = req.params;

    try {
        const db = getDB();
        const route = db.routes.find(r => r.id === parseInt(id));

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json(route);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching route', error: err.message });
    }
};

module.exports = { searchRoutes, getRouteById };
