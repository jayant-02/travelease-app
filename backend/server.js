const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/init');

const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/routes');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the parent directory
app.use(express.static(path.join(__dirname, '../')));

async function startServer() {
    try {
        // JSON file se database initialize kar lo
        initDatabase();

        // API Routes setup kar rahe hain
        app.use('/api/auth', authRoutes);
        app.use('/api/routes', routeRoutes);
        app.use('/api/bookings', bookingRoutes);

        // Agar koi unknown route aaye, toh frontend index file bhej do (SPA style)
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });

        // Chalo server start karte hain
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
