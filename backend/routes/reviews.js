const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addReview, getRouteReviews } = require('../controllers/reviewController');

// Protected add review route
router.post('/', auth, addReview);

// Public route to get reviews
router.get('/route/:routeId', getRouteReviews);

module.exports = router;
