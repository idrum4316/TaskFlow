const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { getUsersDb, getSettingsDb, getSetting, setSetting } = require('../config/couch');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { wrapEmail } = require('../utils/emailTemplate');

const router = express.Router();
const SALT_ROUNDS = 12;

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// GET /api/admin/users — list all users
router.get('/users', async (_req, res) => {
  try {
    const db = getUsersDb();
    const { rows } = await db.view('users', 'all', { include_docs: true });
    res.json(rows.map(r => ({
      _id: r.doc._id,
      username: r.doc.username,
      email: r.doc.email,
      is_admin: r.doc.is_admin,
      created_at: r.doc.created_at,
    })));
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
          html: wrapEmail({
            title: 'You\'ve been invited to TaskFlow',
            body: `
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111827;">You're invited!</h2>
              <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">You've been invited to create an account on <strong>TaskFlow</strong>.</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Click the button below to get started:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:6px;background-color:#4f46e5;">
                    <a href="${link}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Create Your Account</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.</p>
            `,
          }),
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
    const { rows } = await db.view('settings', 'invite_tokens', { include_docs: true });
    res.json(rows.map(r => ({
      token: r.doc.token,
      email: r.doc.email,
      created_at: r.doc.created_at,
      expires_at: r.doc.expires_at,
      created_by: r.doc.created_by,
      used: r.doc.used,
      used_at: r.doc.used_at,
      used_by: r.doc.used_by,
    })));
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
      subject: 'Test Email — TaskFlow',
      text: 'This is a test email from your TaskFlow application. If you received this, your email settings are configured correctly!',
      html: wrapEmail({
        title: 'Test Email — TaskFlow',
        body: `
          <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111827;">Email Configuration Test</h2>
          <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">This is a test email from your <strong>TaskFlow</strong> application.</p>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">If you received this, your email settings are configured correctly &#10003;</p>
        `,
      }),
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
