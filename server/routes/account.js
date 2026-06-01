const express = require('express');
const bcrypt = require('bcrypt');
const { TOTP, Secret } = require('otpauth');
const QRCode = require('qrcode');
const { getUsersDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;
const APP_NAME = 'TaskFlow';

router.use(requireAuth);

// ---------- Password change ----------

// PUT /api/account/password
router.put('/password', async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required' });
  }

  if (new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const db = getUsersDb();

  let user;
  try {
    user = await db.get(req.user.sub);
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }

  const match = await bcrypt.compare(current_password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  user.password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  try {
    await db.insert(user);
    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ---------- MFA (TOTP) ----------

function createTOTP(secret, email) {
  return new TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });
}

// GET /api/account/mfa/status
router.get('/mfa/status', async (req, res) => {
  try {
    const db = getUsersDb();
    const user = await db.get(req.user.sub);
    res.json({ mfa_enabled: !!user.mfa_enabled });
  } catch {
    res.status(500).json({ error: 'Failed to fetch MFA status' });
  }
});

// POST /api/account/mfa/setup — generate a new TOTP secret + QR code
router.post('/mfa/setup', async (req, res) => {
  const db = getUsersDb();

  let user;
  try {
    user = await db.get(req.user.sub);
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.mfa_enabled) {
    return res.status(400).json({ error: 'MFA is already enabled. Disable it first to reconfigure.' });
  }

  // Generate a fresh secret
  const secret = new Secret({ size: 20 });
  const totp = createTOTP(secret, user.email);
  const otpauthUrl = totp.toString();

  // Store the pending secret (not yet verified)
  user.mfa_pending_secret = secret.base32;
  try {
    await db.insert(user);
  } catch {
    return res.status(500).json({ error: 'Failed to save MFA setup' });
  }

  // Generate QR code as data URL
  try {
    const qr = await QRCode.toDataURL(otpauthUrl);
    res.json({ secret: secret.base32, qr, otpauth_url: otpauthUrl });
  } catch {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST /api/account/mfa/verify — confirm setup with a TOTP code
router.post('/mfa/verify', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  const db = getUsersDb();

  let user;
  try {
    user = await db.get(req.user.sub);
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.mfa_pending_secret) {
    return res.status(400).json({ error: 'No pending MFA setup. Call /mfa/setup first.' });
  }

  const secret = Secret.fromBase32(user.mfa_pending_secret);
  const totp = createTOTP(secret, user.email);

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return res.status(400).json({ error: 'Invalid code. Please try again.' });
  }

  // Activate MFA
  user.mfa_secret = user.mfa_pending_secret;
  user.mfa_enabled = true;
  delete user.mfa_pending_secret;

  try {
    await db.insert(user);
    res.json({ message: 'MFA enabled successfully', mfa_enabled: true });
  } catch {
    res.status(500).json({ error: 'Failed to enable MFA' });
  }
});

// POST /api/account/mfa/disable — turn off MFA (requires a valid TOTP code)
router.post('/mfa/disable', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  const db = getUsersDb();

  let user;
  try {
    user = await db.get(req.user.sub);
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.mfa_enabled || !user.mfa_secret) {
    return res.status(400).json({ error: 'MFA is not enabled' });
  }

  const secret = Secret.fromBase32(user.mfa_secret);
  const totp = createTOTP(secret, user.email);

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return res.status(400).json({ error: 'Invalid code. Please try again.' });
  }

  delete user.mfa_secret;
  delete user.mfa_pending_secret;
  user.mfa_enabled = false;

  try {
    await db.insert(user);
    res.json({ message: 'MFA disabled successfully', mfa_enabled: false });
  } catch {
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// ---------- Preferences ----------

function serializePreferences(user) {
  const preferences = user.preferences || {};
  return {
    thick_scrollbars: preferences.thick_scrollbars === true,
  };
}

// GET /api/account/preferences
router.get('/preferences', async (req, res) => {
  try {
    const db = getUsersDb();
    const user = await db.get(req.user.sub);
    res.json(serializePreferences(user));
  } catch {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// PUT /api/account/preferences
router.put('/preferences', async (req, res) => {
  const db = getUsersDb();

  let user;
  try {
    user = await db.get(req.user.sub);
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Request body must be an object' });
  }

  const allowedKeys = new Set(['thick_scrollbars']);
  const unknownKeys = Object.keys(body).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length) {
    return res.status(400).json({ error: `Unknown preference: ${unknownKeys[0]}` });
  }

  const preferences = {};

  if (Object.prototype.hasOwnProperty.call(body, 'thick_scrollbars')) {
    if (typeof body.thick_scrollbars !== 'boolean') {
      return res.status(400).json({ error: 'thick_scrollbars must be a boolean' });
    }
    preferences.thick_scrollbars = body.thick_scrollbars;
  }

  user.preferences = { ...serializePreferences(user), ...preferences };

  try {
    await db.insert(user);
    res.json(user.preferences);
  } catch {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
