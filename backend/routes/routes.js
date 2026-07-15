const express = require('express');
const router = express.Router();

const { searchRoutes, getRouteById } = require('../controllers/routesController');

router.get('/search', searchRoutes);
router.get('/:id', getRouteById);

module.exports = router;
