const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { meiliClient } = require('../config/meili');

const router = express.Router();
router.use(requireAuth);

// GET /api/search?q=...&types=task,note&limit=20
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || !q.trim()) {
    return res.status(400).json({ error: 'q is required' });
  }

  const rawTypes = req.query.types || 'task,note';
  const types = rawTypes.split(',').map((t) => t.trim()).filter(Boolean);

  let limit = parseInt(req.query.limit, 10);
  if (Number.isNaN(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  const userId = req.user.sub;
  const filter = `accessible_to = "${userId}"`;

  const results = [];

  try {
    if (types.includes('task')) {
      const taskResult = await meiliClient.index('tasks').search(q.trim(), {
        filter,
        limit,
      });
      results.push(...taskResult.hits);
    }

    if (types.includes('note')) {
      const noteResult = await meiliClient.index('notes').search(q.trim(), {
        filter,
        limit,
      });
      results.push(...noteResult.hits);
    }

    res.json({ results });
  } catch (err) {
    console.error('Search failed:', err.message);
    res.status(503).json({ error: 'Search unavailable' });
  }
});

module.exports = router;
