const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUsersDb } = require('../config/couch');

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
  const doc = { type: 'user', username, email, password_hash, created_at: now };

  try {
    const result = await db.insert(doc);
    const token = signToken({ sub: result.id, username, email });
    res.status(201).json({ token, user: { id: result.id, username, email } });
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
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

  const token = signToken({ sub: user._id, username: user.username, email: user.email });
  res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
});

module.exports = router;
