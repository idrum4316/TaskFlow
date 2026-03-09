const express = require('express');
const { getUsersDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/users/lookup?email=...
router.get('/lookup', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query parameter is required' });

  try {
    const result = await getUsersDb().find({ selector: { email }, limit: 1 });
    const user = result.docs[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, username: user.username, email: user.email });
  } catch {
    res.status(500).json({ error: 'Failed to look up user' });
  }
});

module.exports = router;
