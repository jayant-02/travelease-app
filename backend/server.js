require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Express app initialize karte hain
const app = express();

// Middlewares setup
app.use(cors());
app.use(express.json());

// Routes mount karte hain
app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/cabs', require('./routes/cabs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviews'));

// Static files (frontend) parent directory se serve karte hain
app.use(express.static(path.join(__dirname, '../')));

// Fallback route index.html bhejne ke liye (SPA routing support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// MongoDB se connect karte hain aur server start karte hain
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected successfully');
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});
