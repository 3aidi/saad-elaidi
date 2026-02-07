const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const trimmedUsername = String(username).trim();
    if (!trimmedUsername) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await db.get('SELECT * FROM admins WHERE username = ?', [trimmedUsername]);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(admin.id, admin.username);

    // Set httpOnly cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Clear cookie with same options used when setting it
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ success: true });
});

// Verify authentication status
router.get('/verify', async (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      authenticated: true,
      admin: {
        id: decoded.id,
        username: decoded.username
      }
    });
  } catch (error) {
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;
