const express = require('express');
const { getTasksDb, getBoardsDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

async function assertBoardAccess(boardId, userId) {
  const board = await getBoardsDb().get(boardId);
  if (board.user_id === userId) return board;
  const share = (board.shares || []).find(
    (s) => s.user_id === userId && s.status === 'accepted'
  );
  if (!share) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return board;
}

// GET /api/tasks/:id/completions
router.get('/', async (req, res) => {
  const db = getTasksDb();
  let task;
  try {
    task = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(task.board_id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

  try {
    const { rows } = await db.view('tasks', 'completions_by_task', {
      key: req.params.id,
      include_docs: true,
    });
    const completions = rows
      .map((r) => r.doc)
      .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
      .slice(0, limit);
    res.json(completions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

module.exports = router;
