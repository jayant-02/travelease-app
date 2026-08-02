const express = require('express');
const router = express.Router();
const { searchRoutes, getCities, getRouteById } = require('../controllers/routesController');

// Public routes for travel routes
router.get('/search', searchRoutes);
router.get('/cities', getCities);
router.get('/:id', getRouteById);

module.exports = router;
