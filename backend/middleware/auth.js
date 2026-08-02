const jwt = require('jsonwebtoken');

// Ye middleware JWT verify karne ke liye hai
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Token missing, authorization denied' });

    // Bearer token check
    const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    const verified = jwt.verify(tokenString, process.env.JWT_SECRET);
    req.user = verified; // { id, role } aayega
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
