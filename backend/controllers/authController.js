const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDB, saveDB } = require('../database/init');

// Ye secret key hum JWT tokens banane ke liye use karte hain
const JWT_SECRET = 'travelease-super-secret-key-2026';

// Naya account banate time ye call hoga
const signup = async (req, res) => {
    let { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    try {
        const db = getDB();

        // Pehle check kar lo ki ye email already registered toh nahi hai
        const exists = db.users.find(u => u.email === email);
        if (exists) {
            return res.status(400).json({ message: 'An account with that email already exists.' });
        }

        // Password ko hash karke secure kar do (plain text mat rakhna)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: db._nextIds.users++,
            username,
            email,
            password: hashedPassword,
            role: 'customer'
        };

        db.users.push(newUser);
        saveDB(db);

        res.status(201).json({ message: 'Account created! You can now sign in.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error during sign up.', error: err.message });
    }
};

// Existing user jab login karega
const login = async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter your email and password.' });
    }

    try {
        const db = getDB();
        const user = db.users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Sab sahi hai, ab 30 din ka session token bana do
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Welcome back!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login.', error: err.message });
    }
};

module.exports = { signup, login };
