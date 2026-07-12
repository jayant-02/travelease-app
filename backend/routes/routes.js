const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');

const router = express.Router();
const OTD_API_KEY = 'TM7g740Y053IV2LZ9UBQ2Pv6dKfmLf0P';
const OTD_URL = `https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${OTD_API_KEY}`;

// Helper: Format time strings (HH:MM AM/PM)
function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

// Fetch and parse live DTC buses
async function fetchLiveBuses(origin, destination) {
    try {
        const response = await fetch(OTD_URL);
        if (!response.ok) {
            throw new Error(`OTD API returned ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
        
        const buses = [];
        
        // Grab up to 5 live buses to represent the routes
        let count = 0;
        for (let entity of feed.entity) {
            if (count >= 5) break;
            
            if (entity.vehicle && entity.vehicle.position) {
                // Generate a mock departure time starting from now
                const now = new Date();
                const dep = new Date(now.getTime() + (count * 30 + 15) * 60000); // spread them out
                const arr = new Date(dep.getTime() + 90 * 60000); // 90 mins duration
                
                buses.push({
                    id: `live_${entity.id}`,
                    operator_name: `DTC (Live ID: ${entity.id})`,
                    transport_type: 'bus',
                    vehicle_type: 'Delhi AC Bus',
                    origin: origin,
                    destination: destination,
                    departure_time: formatTime(dep),
                    arrival_time: formatTime(arr),
                    duration: '1h 30m',
                    price: 25.00,
                    available_seats: 40 // Mocked for the UI
                });
                count++;
            }
        }
        
        return buses;
    } catch (error) {
        console.error("Error fetching GTFS:", error);
        return []; // Return empty array if API fails so trains can still load
    }
}

// @route   GET /api/routes/search
// @desc    Search routes by origin, destination, and optional type
router.get('/search', async (req, res) => {
    const { origin, destination, type } = req.query;
    const db = req.app.locals.db;

    if (!origin || !destination) {
        return res.status(400).json({ message: 'Please provide origin and destination.' });
    }

    try {
        let results = [];

        // 1. Fetch Local Train Data
        if (!type || type === 'all' || type === 'train') {
            let query = 'SELECT * FROM routes WHERE origin COLLATE NOCASE = ? AND destination COLLATE NOCASE = ? AND transport_type = ?';
            const params = [origin, destination, 'train'];
            
            const stmt = db.prepare(query);
            stmt.bind(params);
            
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
        }

        // 2. Fetch Live OTD Bus Data
        if (!type || type === 'all' || type === 'bus') {
            const liveBuses = await fetchLiveBuses(origin, destination);
            results = results.concat(liveBuses);
        }

        res.json({
            count: results.length,
            origin,
            destination,
            routes: results
        });
    } catch (err) {
        res.status(500).json({ message: 'Error searching routes.', error: err.message });
    }
});

// @route   GET /api/routes/:id
// @desc    Get specific route details
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    // Check if this is a live bus ID
    if (id.startsWith('live_')) {
        // For a single live bus, we can just return a mocked object based on the ID
        // In a real app we'd fetch the GTFS feed again, find the ID, and reconstruct it.
        // To save API calls and ensure the booking succeeds, we reconstruct it quickly.
        const mockRoute = {
            id: id,
            operator_name: `DTC (Live ID: ${id.replace('live_', '')})`,
            transport_type: 'bus',
            vehicle_type: 'Delhi AC Bus',
            origin: 'Selected Origin', // Seat-selection UI only uses these for display
            destination: 'Selected Destination',
            departure_time: '12:00 PM',
            arrival_time: '01:30 PM',
            duration: '1h 30m',
            price: 25.00,
            available_seats: 40
        };
        return res.json(mockRoute);
    }
    
    // Otherwise, fetch from local DB (Trains)
    const db = req.app.locals.db;
    try {
        const stmt = db.prepare('SELECT * FROM routes WHERE id = ?');
        stmt.bind([id]);
        
        if (stmt.step()) {
            const route = stmt.getAsObject();
            stmt.free();
            res.json(route);
        } else {
            stmt.free();
            res.status(404).json({ message: 'Route not found.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching route.', error: err.message });
    }
});

// @route   POST /api/routes
// @desc    Add a new route (Admin only)
router.post('/', protect, authorize('admin'), (req, res) => {
    const db = req.app.locals.db;
    const { operator_name, transport_type, vehicle_type, origin, destination, departure_time, arrival_time, duration, price, available_seats } = req.body;

    try {
        const stmt = db.prepare(`
            INSERT INTO routes (operator_name, transport_type, vehicle_type, origin, destination, departure_time, arrival_time, duration, price, available_seats)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([operator_name, transport_type, vehicle_type, origin, destination, departure_time, arrival_time, duration, price, available_seats]);
        stmt.free();
        db.save();

        res.status(201).json({ message: 'Route added successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding route.', error: err.message });
    }
});

module.exports = router;
