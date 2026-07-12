const jwt = require('jsonwebtoken');

// NOTE: Hardcoded for demo purposes
const JWT_SECRET = 'travelease-super-secret-key-2026';

// Middleware to verify JWT token
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized to access this route. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch user from DB to attach to request
        const db = req.app.locals.db;
        const stmt = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?');
        stmt.bind([decoded.id]);
        
        if (stmt.step()) {
            req.user = stmt.getAsObject();
            stmt.free();
            next();
        } else {
            stmt.free();
            return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
        }
    } catch (err) {
        return res.status(401).json({ message: 'Token is invalid or expired. Please log in again.' });
    }
};

// Middleware to restrict access based on roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Sorry, ${req.user.role}s don't have permission to do this. Required role: ${roles.join(' or ')}.` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize, JWT_SECRET };
