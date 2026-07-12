const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '../../travelease.db');

async function initDatabase() {
    console.log('🗄️  Initializing database...');
    const SQL = await initSqlJs();
    let db;

    if (fs.existsSync(DB_PATH)) {
        const filebuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(filebuffer);
        console.log('  → Loaded existing database');
    } else {
        db = new SQL.Database();
        console.log('  → Created new database');

        // Create Tables
        db.run(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'customer'
            );

            CREATE TABLE routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operator_name TEXT NOT NULL,
                transport_type TEXT NOT NULL, -- 'bus' or 'train'
                vehicle_type TEXT NOT NULL,
                origin TEXT NOT NULL,
                destination TEXT NOT NULL,
                departure_time TEXT NOT NULL,
                arrival_time TEXT NOT NULL,
                duration TEXT NOT NULL,
                price INTEGER NOT NULL,
                available_seats INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                route_id INTEGER NOT NULL,
                travel_date TEXT NOT NULL,
                seats INTEGER NOT NULL,
                total_price INTEGER NOT NULL,
                status TEXT DEFAULT 'confirmed',
                booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (route_id) REFERENCES routes (id)
            );
        `);

        // Seed Routes
        console.log('  → Seeding routes table with sample data...');
        const stmt = db.prepare(`
            INSERT INTO routes (
                operator_name, transport_type, vehicle_type, origin, destination, 
                departure_time, arrival_time, duration, price, available_seats
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const seedData = [
            // Indore -> Bhopal (from original results)
            ['Chartered Bus', 'bus', 'A/C Sleeper', 'Indore', 'Bhopal', '10:00 AM', '02:00 PM', '4 hrs', 500, 36],
            ['Hans Travels', 'bus', 'Non A/C Seater', 'Indore', 'Bhopal', '01:30 PM', '06:00 PM', '4.5 hrs', 400, 45],
            ['Intercity Express', 'bus', 'Premium Volvo', 'Indore', 'Bhopal', '05:00 PM', '08:30 PM', '3.5 hrs', 750, 32],
            ['Shatabdi Express', 'train', 'AC Chair Car', 'Indore', 'Bhopal', '06:15 AM', '09:15 AM', '3 hrs', 350, 120],
            ['Narmada Express', 'train', 'Sleeper Class', 'Indore', 'Bhopal', '02:00 PM', '07:00 PM', '5 hrs', 220, 200],
            ['Malwa Express', 'train', 'AC 3-Tier', 'Indore', 'Bhopal', '11:00 PM', '04:30 AM', '5.5 hrs', 480, 72],

            // Delhi -> Jaipur
            ['RSRTC Volvo', 'bus', 'A/C Seater', 'Delhi', 'Jaipur', '08:00 AM', '01:00 PM', '5 hrs', 450, 40],
            ['Double Decker', 'train', 'AC Chair Car', 'Delhi', 'Jaipur', '05:35 PM', '10:05 PM', '4.5 hrs', 500, 150],

            // Mumbai -> Pune
            ['Neeta Travels', 'bus', 'A/C Sleeper', 'Mumbai', 'Pune', '07:00 AM', '10:30 AM', '3.5 hrs', 350, 30],
            ['Deccan Queen', 'train', 'AC Chair Car', 'Mumbai', 'Pune', '05:10 PM', '08:25 PM', '3.2 hrs', 400, 120]
        ];

        for (const row of seedData) {
            stmt.run(row);
        }
        stmt.free();
        
        saveDatabase(db);
        console.log(`  → Seeded ${seedData.length} sample routes`);
    }

    console.log('✅ Database ready');

    // Add save helper directly to the db instance
    db.save = () => saveDatabase(db);
    return db;
}

function saveDatabase(db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

module.exports = { initDatabase };
