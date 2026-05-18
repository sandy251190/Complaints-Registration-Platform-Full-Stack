const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { users } = require('../db/schema');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new verified user
        await db.insert(users).values({
            name,
            email,
            password, // Plain text as requested
            is_verified: true
        });

        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (userList.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = userList[0];
        if (!user.is_verified) {
            return res.status(400).json({ error: 'Account not verified' });
        }

        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Set cookie
        const isProduction = process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https');
        res.cookie('token', token, {
            httpOnly: false,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ name: user.name, email: user.email, role: user.role });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userList = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
        
        if (userList.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = userList[0];
        res.json({ name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
