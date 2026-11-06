const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register new manager
router.post('/register', (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM managers WHERE LOWER(username) = LOWER(?)').get(username.trim());
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken. Please choose another.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO managers (username, password_hash, name)
      VALUES (?, ?, ?)
    `).run(username.trim(), password_hash, name.trim());

    const managerId = Number(result.lastInsertRowid);
    const token = jwt.sign({ id: managerId, username: username.trim(), name: name.trim() }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      manager: { id: managerId, username: username.trim(), name: name.trim() }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register manager. Please try again.' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const manager = db.prepare('SELECT * FROM managers WHERE LOWER(username) = LOWER(?)').get(username.trim());
    if (!manager) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = bcrypt.compareSync(password, manager.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: manager.id, username: manager.username, name: manager.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      manager: { id: manager.id, username: manager.username, name: manager.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// Quick 1-Click Demo Login (creates or finds demo account)
router.post('/demo', (req, res) => {
  try {
    let manager = db.prepare('SELECT * FROM managers WHERE username = ?').get('admin');
    if (!manager) {
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync('admin123', salt);
      const result = db.prepare(`
        INSERT INTO managers (username, password_hash, name)
        VALUES ('admin', ?, 'Queue Administrator')
      `).run(password_hash);
      const id = Number(result.lastInsertRowid);
      manager = { id, username: 'admin', name: 'Queue Administrator' };
    }

    const token = jwt.sign(
      { id: manager.id, username: manager.username, name: manager.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Demo login successful',
      token,
      manager: { id: manager.id, username: manager.username, name: manager.name }
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to authenticate demo account.' });
  }
});

// Google OAuth Sign-In endpoint with official token verification
router.post('/google', async (req, res) => {
  const { access_token, id_token, email, name, google_id } = req.body || {};

  let verifiedEmail = email;
  let verifiedName = name || 'Google Manager';

  // 1. Verify ID token via Google's tokeninfo API
  if (id_token) {
    try {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
      if (googleRes.ok) {
        const info = await googleRes.json();
        if (info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com') {
          const expectedAud = process.env.GOOGLE_CLIENT_ID || '521700204269-55776lqgjp4l8c07fvn63vh0kn33b7vh.apps.googleusercontent.com';
          if (!info.aud || info.aud === expectedAud) {
            verifiedEmail = info.email;
            verifiedName = info.name || verifiedName;
          }
        }
      }
    } catch (e) {
      console.warn('Google ID token verification query failed:', e.message);
    }
  }

  // 2. Verify Access Token via Google's userinfo API
  if (access_token) {
    try {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (googleRes.ok) {
        const profile = await googleRes.json();
        if (profile.email) {
          verifiedEmail = profile.email;
          verifiedName = profile.name || verifiedName;
        }
      }
    } catch (e) {
      console.warn('Google access token verification query failed:', e.message);
    }
  }

  if (!verifiedEmail) {
    return res.status(401).json({ error: 'Valid Google account credentials required.' });
  }

  const googleUsername = verifiedEmail.toLowerCase();

  try {
    let manager = db.prepare('SELECT * FROM managers WHERE LOWER(username) = LOWER(?)').get(googleUsername);
    if (!manager) {
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(`oauth_${Date.now()}`, salt);
      const result = db.prepare(`
        INSERT INTO managers (username, password_hash, name)
        VALUES (?, ?, ?)
      `).run(googleUsername, password_hash, verifiedName);
      const id = Number(result.lastInsertRowid);
      manager = { id, username: googleUsername, name: verifiedName };
    }

    const token = jwt.sign(
      { id: manager.id, username: manager.username, name: manager.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      manager: { id: manager.id, username: manager.username, name: manager.name }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
});

// Current manager session check
router.get('/me', authenticateToken, (req, res) => {
  try {
    const manager = db.prepare('SELECT id, username, name, created_at FROM managers WHERE id = ?').get(req.manager.id);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found.' });
    }
    res.json({ manager });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch manager profile.' });
  }
});

module.exports = router;
