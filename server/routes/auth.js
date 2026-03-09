const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUsersDb, getSetting } = require('../config/couch');

const router = express.Router();
const SALT_ROUNDS = 12;

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getUsersDb();

  // Check if this is the very first user (auto-admin)
  let isFirstUser = false;
  try {
    const allUsers = await db.find({ selector: { type: 'user' }, limit: 1 });
    isFirstUser = allUsers.docs.length === 0;
  } catch {
    return res.status(500).json({ error: 'Database error' });
  }

  // If not the first user, check if registration is enabled
  if (!isFirstUser) {
    try {
      const regEnabled = await getSetting('registration_enabled');
      if (regEnabled === false) {
        return res.status(403).json({ error: 'Registration is currently disabled' });
      }
    } catch {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Check for duplicate email or username
  try {
    const existing = await db.find({
      selector: { $or: [{ email }, { username }] },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
  } catch {
    return res.status(500).json({ error: 'Database error' });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();
  const is_admin = isFirstUser;
  const doc = { type: 'user', username, email, password_hash, is_admin, created_at: now };

  try {
    const result = await db.insert(doc);
    const token = signToken({ sub: result.id, username, email, is_admin });
    res.status(201).json({ token, user: { id: result.id, username, email, is_admin } });
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/auth/registration-status
router.get('/registration-status', async (_req, res) => {
  try {
    const regEnabled = await getSetting('registration_enabled');
    res.json({ registration_enabled: regEnabled !== false });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db = getUsersDb();

  let user;
  try {
    const result = await db.find({ selector: { email }, limit: 1 });
    user = result.docs[0];
  } catch {
    return res.status(500).json({ error: 'Database error' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const is_admin = !!user.is_admin;
  const token = signToken({ sub: user._id, username: user.username, email: user.email, is_admin });
  res.json({ token, user: { id: user._id, username: user.username, email: user.email, is_admin } });
});

module.exports = router;
