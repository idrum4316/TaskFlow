const express = require('express');
const bcrypt = require('bcrypt');
const { getUsersDb, getSetting, setSetting } = require('../config/couch');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// GET /api/admin/users — list all users
router.get('/users', async (_req, res) => {
  try {
    const db = getUsersDb();
    const { docs } = await db.find({
      selector: { type: 'user' },
      fields: ['_id', 'username', 'email', 'is_admin', 'created_at'],
      limit: 10000,
    });
    res.json(docs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/reset-password — reset a user's password
router.put('/users/:id/reset-password', async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const db = getUsersDb();
    const user = await db.get(req.params.id);

    if (!user || user.type !== 'user') {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.insert(user);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PUT /api/admin/users/:id/toggle-admin — toggle admin status
router.put('/users/:id/toggle-admin', async (req, res) => {
  try {
    const db = getUsersDb();
    const user = await db.get(req.params.id);

    if (!user || user.type !== 'user') {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow removing your own admin status
    if (user._id === req.user.sub) {
      return res.status(400).json({ error: 'Cannot change your own admin status' });
    }

    user.is_admin = !user.is_admin;
    await db.insert(user);
    res.json({ id: user._id, username: user.username, email: user.email, is_admin: user.is_admin });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/admin/settings — get all admin settings
router.get('/settings', async (_req, res) => {
  try {
    const registration_enabled = await getSetting('registration_enabled');
    res.json({ registration_enabled: registration_enabled !== false });
  } catch {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/admin/settings — update settings
router.put('/settings', async (req, res) => {
  try {
    const { registration_enabled } = req.body;

    if (typeof registration_enabled === 'boolean') {
      await setSetting('registration_enabled', registration_enabled);
    }

    const current = await getSetting('registration_enabled');
    res.json({ registration_enabled: current !== false });
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
