const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { TOTP, Secret } = require('otpauth');
const { getUsersDb, getSettingsDb, getSetting } = require('../config/couch');

const router = express.Router();
const SALT_ROUNDS = 12;

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function signMfaToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });
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

  // If not the first user, check if registration is enabled (or a valid invite token is provided)
  let inviteDoc = null;
  if (!isFirstUser) {
    const { invitation_token } = req.body;
    if (invitation_token) {
      try {
        const settingsDb = getSettingsDb();
        inviteDoc = await settingsDb.get(`invite_${invitation_token}`);
        if (!inviteDoc || inviteDoc.type !== 'invite_token' || inviteDoc.used) {
          return res.status(403).json({ error: 'Invalid or already used invitation token' });
        }
      } catch (err) {
        if (err.statusCode === 404) {
          return res.status(403).json({ error: 'Invalid or already used invitation token' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
    } else {
      try {
        const regEnabled = await getSetting('registration_enabled');
        if (regEnabled === false) {
          return res.status(403).json({ error: 'Registration is currently disabled' });
        }
      } catch {
        return res.status(500).json({ error: 'Database error' });
      }
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

    // Mark invite token as used
    if (inviteDoc) {
      const settingsDb = getSettingsDb();
      inviteDoc.used = true;
      inviteDoc.used_at = new Date().toISOString();
      inviteDoc.used_by = result.id;
      await settingsDb.insert(inviteDoc);
    }

    const token = signToken({ sub: result.id, username, email, is_admin });
    res.status(201).json({ token, user: { id: result.id, username, email, is_admin } });
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/auth/registration-status
router.get('/registration-status', async (req, res) => {
  try {
    const regEnabled = await getSetting('registration_enabled');
    const result = { registration_enabled: regEnabled !== false };

    // If an invitation token is provided, validate it
    const { token } = req.query;
    if (token) {
      try {
        const settingsDb = getSettingsDb();
        const doc = await settingsDb.get(`invite_${token}`);
        result.valid_token = !!(doc && doc.type === 'invite_token' && !doc.used);
      } catch {
        result.valid_token = false;
      }
    }

    res.json(result);
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

  // If MFA is enabled, return a short-lived MFA challenge token
  if (user.mfa_enabled && user.mfa_secret) {
    const mfa_token = signMfaToken({ sub: user._id, mfa: true });
    return res.json({ mfa_required: true, mfa_token });
  }

  const is_admin = !!user.is_admin;
  const token = signToken({ sub: user._id, username: user.username, email: user.email, is_admin });
  res.json({ token, user: { id: user._id, username: user.username, email: user.email, is_admin } });
});

// POST /api/auth/mfa-verify — complete login with TOTP code
router.post('/mfa-verify', async (req, res) => {
  const { mfa_token, code } = req.body;

  if (!mfa_token || !code) {
    return res.status(400).json({ error: 'mfa_token and code are required' });
  }

  let payload;
  try {
    payload = jwt.verify(mfa_token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'MFA session expired. Please log in again.' });
  }

  if (!payload.mfa) {
    return res.status(400).json({ error: 'Invalid MFA token' });
  }

  const db = getUsersDb();

  let user;
  try {
    user = await db.get(payload.sub);
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.mfa_enabled || !user.mfa_secret) {
    return res.status(400).json({ error: 'MFA is not enabled for this account' });
  }

  const secret = Secret.fromBase32(user.mfa_secret);
  const totp = new TOTP({
    issuer: 'TaskFlow',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return res.status(400).json({ error: 'Invalid code. Please try again.' });
  }

  const is_admin = !!user.is_admin;
  const token = signToken({ sub: user._id, username: user.username, email: user.email, is_admin });
  res.json({ token, user: { id: user._id, username: user.username, email: user.email, is_admin } });
});

module.exports = router;
