const Review = require('../models/Review');
const Route = require('../models/Route');

// Naya review add karo
exports.addReview = async (req, res) => {
  try {
    const { routeId, rating, comment } = req.body;
    
    const review = new Review({
      userId: req.user.id,
      routeId,
      rating,
      comment
    });
    
    await review.save();
    
    // Route ki average rating update karo
    const route = await Route.findById(routeId);
    if (route) {
      const allReviews = await Review.find({ routeId });
      const totalRatingSum = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
      route.totalRatings = allReviews.length;
      route.rating = route.totalRatings > 0 ? (totalRatingSum / route.totalRatings) : 0;
      await route.save();
    }
    
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Ek route ke saare reviews laao
exports.getRouteReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ routeId: req.params.routeId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
