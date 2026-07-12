const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const db = req.app.locals.db;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    try {
        // Check if user exists
        const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
        checkStmt.bind([email]);
        if (checkStmt.step()) {
            checkStmt.free();
            return res.status(400).json({ message: 'An account with that email already exists.' });
        }
        checkStmt.free();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const insertStmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
        insertStmt.run([username, email, hashedPassword]);
        insertStmt.free();
        db.save();

        // Get created user
        const getStmt = db.prepare('SELECT id, username, email, role FROM users WHERE email = ?');
        getStmt.bind([email]);
        getStmt.step();
        const user = getStmt.getAsObject();
        getStmt.free();

        res.status(201).json({
            message: 'Account created successfully! Welcome to TravelEase.',
            token: generateToken(user.id),
            user
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during signup.', error: err.message });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        stmt.bind([email]);
        
        if (!stmt.step()) {
            stmt.free();
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        
        const user = stmt.getAsObject();
        stmt.free();

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Don't send password hash back
        delete user.password;

        res.json({
            message: `Welcome back, ${user.username}!`,
            token: generateToken(user.id),
            user
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login.', error: err.message });
    }
});

// @route   GET /api/auth/me
router.get('/me', protect, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
