const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/init');

const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/routes');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the parent directory
app.use(express.static(path.join(__dirname, '../')));

async function startServer() {
    try {
        // Initialize the database (sql.js is async)
        const db = await initDatabase();
        
        // Make the db instance available to routers via req.app.locals
        app.locals.db = db;

        // API Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/routes', routeRoutes);
        app.use('/api/bookings', bookingRoutes);

        // Fallback for SPA or static pages
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });

        app.listen(PORT, () => {
            console.log(`\n===========================================`);
            console.log(`  🚌 TravelEase Backend Server Running`);
            console.log(`===========================================`);
            console.log(`  🌐 Frontend:  http://localhost:${PORT}`);
            console.log(`  📡 API Base:  http://localhost:${PORT}/api\n`);
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
