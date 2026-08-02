const auth = require('./auth');

// Admin roles verify karne wala middleware
const adminAuth = (req, res, next) => {
  // Pehle auth run karo
  auth(req, res, () => {
    // Phir role check karo
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin access denied' });
    }
  });
};

module.exports = adminAuth;
