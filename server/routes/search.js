const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { meiliClient } = require('../config/meili');
const { getBoardsDb } = require('../config/couch');

const router = express.Router();
router.use(requireAuth);

function quoteFilterValue(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// GET /api/search?q=...&types=task,note&limit=20[&board_id=...]
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

  // Resolve the user's accessible board IDs from CouchDB at query time.
  // This is the authoritative source — no stale access data in the index.
  let accessibleBoardIds;
  try {
    const boardsDb = getBoardsDb();
    const [ownedResult, sharedResult] = await Promise.all([
      boardsDb.view('boards', 'by_user', { key: userId }),
      boardsDb.view('boards', 'by_shared_user', { key: userId }),
    ]);
    accessibleBoardIds = [
      ...new Set([
        ...ownedResult.rows.map((r) => r.id),
        ...sharedResult.rows.map((r) => r.id),
      ]),
    ];
  } catch (err) {
    console.error('Search: failed to resolve board access:', err.message);
    return res.status(503).json({ error: 'Search unavailable' });
  }

  // User with no boards has nothing to search.
  if (accessibleBoardIds.length === 0) {
    return res.json({ results: [] });
  }

  const rawBoardId = req.query.board_id;
  const boardId = typeof rawBoardId === 'string' ? rawBoardId.trim() : '';

  // Build Meilisearch filter. Using board_id IN [...] means authorization is
  // always derived from live CouchDB data — share additions/revocations take
  // effect immediately without any re-indexing.
  const boardListFilter = `board_id IN [${accessibleBoardIds.map(quoteFilterValue).join(', ')}]`;
  const filters = [boardListFilter];
  if (boardId) filters.push(`board_id = ${quoteFilterValue(boardId)}`);
  const filter = filters.join(' AND ');

  try {
    const searchOpts = { filter, limit, showRankingScore: true };
    const queries = [];
    if (types.includes('task')) queries.push(meiliClient.index('tasks').search(q.trim(), searchOpts));
    if (types.includes('note')) queries.push(meiliClient.index('notes').search(q.trim(), searchOpts));

    const responses = await Promise.all(queries);

    // Merge hits from all indexes, sort by descending relevance score, then cap at limit
    const merged = responses
      .flatMap((r) => r.hits)
      .sort((a, b) => (b._rankingScore ?? 0) - (a._rankingScore ?? 0))
      .slice(0, limit);

    // Strip internal ranking field before sending to client
    const results = merged.map(({ _rankingScore, ...hit }) => hit);

    res.json({ results });
  } catch (err) {
    console.error('Search failed:', err.message);
    res.status(503).json({ error: 'Search unavailable' });
  }
});

module.exports = router;
