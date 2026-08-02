require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Route = require('../models/Route');
const Booking = require('../models/Booking');
const CabBooking = require('../models/CabBooking');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travelease';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    console.log('Dropping existing collections...');
    await User.deleteMany({});
    await Route.deleteMany({});
    await Booking.deleteMany({});
    await CabBooking.deleteMany({});
    await Review.deleteMany({});

    console.log('Creating Admin User...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@travelease.com',
      password: adminPassword,
      role: 'admin'
    });
    await adminUser.save();

    console.log('Creating Test User...');
    const testPassword = await bcrypt.hash('test123', 10);
    const testUser = new User({
      name: 'Test User',
      email: 'test@gmail.com',
      password: testPassword,
      role: 'user'
    });
    await testUser.save();

    console.log('Inserting Routes...');
    const cityPairs = [
      { origin: 'Indore', destination: 'Bhopal', count: 6 },
      { origin: 'Delhi', destination: 'Jaipur', count: 6 },
      { origin: 'Mumbai', destination: 'Pune', count: 6 },
      { origin: 'Bangalore', destination: 'Mysore', count: 4 },
      { origin: 'Hyderabad', destination: 'Chennai', count: 4 },
      { origin: 'Ahmedabad', destination: 'Surat', count: 4 },
      { origin: 'Delhi', destination: 'Chandigarh', count: 4 },
      { origin: 'Kolkata', destination: 'Varanasi', count: 4 },
      { origin: 'Mumbai', destination: 'Goa', count: 4 },
      { origin: 'Bangalore', destination: 'Chennai', count: 4 },
      { origin: 'Delhi', destination: 'Lucknow', count: 4 },
      { origin: 'Jaipur', destination: 'Udaipur', count: 4 },
      { origin: 'Kochi', destination: 'Coimbatore', count: 3 },
      { origin: 'Pune', destination: 'Nagpur', count: 3 },
      { origin: 'Delhi', destination: 'Agra', count: 4 }
    ];

    const busOperators = ['Chartered Bus', 'Hans Travels', 'IntrCity SmartBus', 'Zingbus', 'VRL Travels', 'Orange Travels'];
    const trainOperators = ['Indian Railways', 'IRCTC', 'Vande Bharat Express', 'Shatabdi Express', 'Rajdhani Express'];
    const busTypes = ['AC Sleeper', 'Volvo AC Seater', 'Non-AC Sleeper'];
    const trainTypes = ['3A', '2A', '1A', 'Sleeper', 'CC'];

    const routes = [];

    for (const pair of cityPairs) {
      for (let i = 0; i < pair.count; i++) {
        // Randomly choose transport type
        const isBus = Math.random() > 0.3; // 70% buses, 30% trains
        const transportType = isBus ? 'bus' : 'train';
        
        let operatorName, vehicleType, totalSeats, price;
        
        if (isBus) {
          operatorName = busOperators[Math.floor(Math.random() * busOperators.length)];
          vehicleType = busTypes[Math.floor(Math.random() * busTypes.length)];
          totalSeats = Math.floor(Math.random() * (52 - 36 + 1)) + 36;
          price = Math.floor(Math.random() * 800) + 400; // 400 to 1200
        } else {
          operatorName = trainOperators[Math.floor(Math.random() * trainOperators.length)];
          vehicleType = trainTypes[Math.floor(Math.random() * trainTypes.length)];
          totalSeats = Math.floor(Math.random() * (200 - 72 + 1)) + 72;
          price = Math.floor(Math.random() * 1500) + 300; // 300 to 1800
        }

        // Dummy timings
        const hour = Math.floor(Math.random() * 24);
        const departureTime = `${hour.toString().padStart(2, '0')}:00`;
        const durationHours = Math.floor(Math.random() * 10) + 2;
        const arrivalHour = (hour + durationHours) % 24;
        const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:30`;
        const duration = `${durationHours}h 30m`;

        // Dono taraf ka route daalte hain
        const origin = i % 2 === 0 ? pair.origin : pair.destination;
        const destination = i % 2 === 0 ? pair.destination : pair.origin;

        routes.push({
          operatorName,
          transportType,
          vehicleType,
          origin,
          destination,
          departureTime,
          arrivalTime,
          duration,
          price,
          totalSeats,
          availableSeats: totalSeats,
          rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
          totalRatings: Math.floor(Math.random() * 100)
        });
      }
    }

    await Route.insertMany(routes);
    console.log(`Inserted ${routes.length} routes!`);
    
    console.log('Seed completed successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    mongoose.disconnect();
  }
};

seedDatabase();
