const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { getUsersDb, getSettingsDb, getSetting, setSetting } = require('../config/couch');
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

// POST /api/admin/invite-tokens — generate a single-use invitation token and email it
router.post('/invite-tokens', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  try {
    const db = getSettingsDb();
    const token = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await db.insert({
      _id: `invite_${token}`,
      type: 'invite_token',
      token,
      email,
      created_by: req.user.sub,
      created_at,
      expires_at,
      used: false,
    });

    // Build the invitation link
    const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const link = `${origin}/register?token=${token}`;

    // Send the invitation email
    try {
      const host = await getSetting('smtp_host');
      const port = await getSetting('smtp_port');
      const secure = await getSetting('smtp_secure');
      const user = await getSetting('smtp_user');
      const pass = await getSetting('smtp_pass');
      const from = await getSetting('email_from');

      if (host && port) {
        const transportConfig = {
          host,
          port: Number(port),
          secure: secure === true || secure === 'true',
        };
        if (user && pass) {
          transportConfig.auth = { user, pass };
        }
        const transporter = nodemailer.createTransport(transportConfig);
        await transporter.sendMail({
          from: from || user || 'noreply@localhost',
          to: email,
          subject: 'You\'ve been invited to TaskFlow',
          text: `You've been invited to create an account on TaskFlow.\n\nClick the link below to register:\n${link}\n\nThis invitation expires in 7 days.`,
          html: `<p>You've been invited to create an account on <strong>TaskFlow</strong>.</p><p><a href="${link}">Click here to register</a></p><p>This invitation expires in 7 days.</p>`,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send invitation email:', emailErr.message);
      // Token was still created — don't fail the request
    }

    res.status(201).json({ token, email, created_at, expires_at });
  } catch {
    res.status(500).json({ error: 'Failed to create invitation token' });
  }
});

// GET /api/admin/invite-tokens — list all invitation tokens
router.get('/invite-tokens', async (_req, res) => {
  try {
    const db = getSettingsDb();
    const { docs } = await db.find({
      selector: { type: 'invite_token' },
      fields: ['token', 'email', 'created_at', 'expires_at', 'created_by', 'used', 'used_at', 'used_by'],
      limit: 10000,
    });
    res.json(docs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch invitation tokens' });
  }
});

// DELETE /api/admin/invite-tokens/:token — revoke an invitation token
router.delete('/invite-tokens/:token', async (req, res) => {
  try {
    const db = getSettingsDb();
    const doc = await db.get(`invite_${req.params.token}`);
    if (!doc || doc.type !== 'invite_token') {
      return res.status(404).json({ error: 'Token not found' });
    }
    await db.destroy(doc._id, doc._rev);
    res.json({ message: 'Token revoked' });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Token not found' });
    }
    res.status(500).json({ error: 'Failed to revoke token' });
  }
});

const EMAIL_SETTING_KEYS = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'email_from'];

// GET /api/admin/email-settings — get email/SMTP settings
router.get('/email-settings', async (_req, res) => {
  try {
    const result = {};
    for (const key of EMAIL_SETTING_KEYS) {
      const val = await getSetting(key);
      // Mask the password — only indicate whether it's set
      if (key === 'smtp_pass') {
        result[key] = val ? '••••••••' : '';
      } else {
        result[key] = val ?? '';
      }
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

// PUT /api/admin/email-settings — update email/SMTP settings
router.put('/email-settings', async (req, res) => {
  try {
    for (const key of EMAIL_SETTING_KEYS) {
      if (key in req.body) {
        // Don't overwrite password with the mask placeholder
        if (key === 'smtp_pass' && req.body[key] === '••••••••') continue;
        await setSetting(key, req.body[key]);
      }
    }
    // Return current settings (masked)
    const result = {};
    for (const key of EMAIL_SETTING_KEYS) {
      const val = await getSetting(key);
      if (key === 'smtp_pass') {
        result[key] = val ? '••••••••' : '';
      } else {
        result[key] = val ?? '';
      }
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

// POST /api/admin/email-settings/test — send a test email
router.post('/email-settings/test', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Recipient email address is required' });
    }

    const host = await getSetting('smtp_host');
    const port = await getSetting('smtp_port');
    const secure = await getSetting('smtp_secure');
    const user = await getSetting('smtp_user');
    const pass = await getSetting('smtp_pass');
    const from = await getSetting('email_from');

    if (!host || !port) {
      return res.status(400).json({ error: 'SMTP host and port must be configured first' });
    }

    const transportConfig = {
      host,
      port: Number(port),
      secure: secure === true || secure === 'true',
    };

    if (user && pass) {
      transportConfig.auth = { user, pass };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    await transporter.sendMail({
      from: from || user || 'noreply@localhost',
      to,
      subject: 'Test Email — Todo App',
      text: 'This is a test email from your Todo application. If you received this, your email settings are configured correctly!',
      html: '<p>This is a test email from your <strong>Todo</strong> application.</p><p>If you received this, your email settings are configured correctly!</p>',
    });

    res.json({ message: 'Test email sent successfully' });
  } catch (err) {
    const detail = err.responseCode
      ? `SMTP error ${err.responseCode}: ${err.response}`
      : err.message;
    res.status(500).json({ error: `Failed to send test email: ${detail}` });
  }
});

module.exports = router;
