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

// GET /api/tasks/:id/comments
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

  try {
    const { rows } = await db.view('tasks', 'by_task', {
      key: req.params.id,
      include_docs: true,
    });
    const comments = rows.map((r) => r.doc).sort((a, b) => a.created_at.localeCompare(b.created_at));
    res.json(comments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/tasks/:id/comments
router.post('/', async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'body is required' });

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

  const now = new Date().toISOString();
  const doc = {
    type: 'comment',
    task_id: req.params.id,
    board_id: task.board_id,
    user_id: req.user.sub,
    username: req.user.username,
    body: body.trim(),
    created_at: now,
    updated_at: now,
  };

  try {
    const result = await db.insert(doc);
    res.status(201).json({ ...doc, _id: result.id, _rev: result.rev });
  } catch {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// DELETE /api/tasks/:id/comments/:commentId
router.delete('/:commentId', async (req, res) => {
  const db = getTasksDb();
  let comment;
  try {
    comment = await db.get(req.params.commentId);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Comment not found' });
    return res.status(500).json({ error: 'Failed to fetch comment' });
  }

  if (comment.type !== 'comment' || comment.task_id !== req.params.id) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  // Allow: comment author or board owner
  let board;
  try {
    board = await getBoardsDb().get(comment.board_id);
  } catch {
    return res.status(500).json({ error: 'Failed to verify permissions' });
  }

  const isBoardOwner = board.user_id === req.user.sub;
  const isAuthor = comment.user_id === req.user.sub;
  if (!isBoardOwner && !isAuthor) return res.status(403).json({ error: 'Forbidden' });

  try {
    await db.destroy(comment._id, comment._rev);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
