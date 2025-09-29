/**
 * Authentication Routes
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Mock user database (in production, use real database)
const users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin'
    }
];

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.json({
            token: token,
            expires_in: process.env.JWT_EXPIRES_IN || 3600,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});

/**
 * POST /api/auth/register
 * User registration
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Username, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            role: 'user'
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                username: newUser.username, 
                role: newUser.role 
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.status(201).json({
            token: token,
            expires_in: process.env.JWT_EXPIRES_IN || 3600,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
