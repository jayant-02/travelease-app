const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { 
  getDashboard, 
  getAllRoutes, 
  addRoute, 
  updateRoute, 
  deleteRoute, 
  getAllBookings, 
  getAllUsers 
} = require('../controllers/adminController');

// Admin protected routes
router.get('/dashboard', adminAuth, getDashboard);
router.get('/routes', adminAuth, getAllRoutes);
router.post('/routes', adminAuth, addRoute);
router.put('/routes/:id', adminAuth, updateRoute);
router.delete('/routes/:id', adminAuth, deleteRoute);
router.get('/bookings', adminAuth, getAllBookings);
router.get('/users', adminAuth, getAllUsers);

module.exports = router;
