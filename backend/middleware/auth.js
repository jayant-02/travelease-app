const jwt = require('jsonwebtoken');

// Token verify karne ke liye secret key
const JWT_SECRET = 'travelease-super-secret-key-2026';

// Ye function route protect karega taaki sirf logged-in user hi access kar sakein
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Aapne login nahi kiya hai (Token missing)' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // JSON DB se user dhoondho taaki aage use ho sake
        const { getDB } = require('../database/init');
        const db = getDB();
        const user = db.users.find(u => u.id === decoded.id);
        
        if (user) {
            // Password nikal do security ke liye
            const { password, ...userWithoutPassword } = user;
            req.user = userWithoutPassword;
            next();
        } else {
            return res.status(401).json({ message: 'Ye user ab exist nahi karta.' });
        }
    } catch (err) {
        return res.status(403).json({ message: 'Token invalid hai ya expire ho chuka hai. Dubara login karo.' });
    }
};

// Roles ke hisaab se access control karne wala middleware
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
