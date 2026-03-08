const express = require('express');
const { getTasksDb, getBoardsDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function validateTask(body, requireBoardId = false) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('title is required');
  if (requireBoardId && !body.board_id) errors.push('board_id is required');
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  return errors;
}

async function assertBoardOwnership(boardId, userId) {
  const board = await getBoardsDb().get(boardId);
  if (board.user_id !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return board;
}

// GET /api/tasks?board_id=xxx[&status=todo]
router.get('/', async (req, res) => {
  const { board_id, status } = req.query;

  if (!board_id) {
    return res.status(400).json({ error: 'board_id query parameter is required' });
  }

  // Verify the board belongs to this user
  try {
    await assertBoardOwnership(board_id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  const db = getTasksDb();
  try {
    let docs;
    if (status && VALID_STATUSES.includes(status)) {
      const { rows } = await db.view('tasks', 'by_board_and_status', {
        key: [board_id, status],
        include_docs: true,
      });
      docs = rows.map((r) => r.doc);
    } else {
      const { rows } = await db.view('tasks', 'by_board', {
        key: board_id,
        include_docs: true,
      });
      docs = rows.map((r) => r.doc);
    }
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const errors = validateTask(req.body, true);
  if (errors.length) return res.status(400).json({ errors });

  // Verify board ownership
  try {
    await assertBoardOwnership(req.body.board_id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  const now = new Date().toISOString();
  const doc = {
    type: 'task',
    user_id: req.user.sub,
    board_id: req.body.board_id,
    title: req.body.title.trim(),
    description: req.body.description?.trim() || '',
    status: req.body.status || 'todo',
    priority: req.body.priority || 'medium',
    due_date: req.body.due_date || null,
    created_at: now,
    updated_at: now,
  };

  try {
    const result = await getTasksDb().insert(doc);
    res.status(201).json({ ...doc, _id: result.id, _rev: result.rev });
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await getTasksDb().get(req.params.id);
    if (doc.user_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });
    res.json(doc);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const errors = validateTask(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const db = getTasksDb();

  let existing;
  try {
    existing = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  if (existing.user_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

  // If moving to a different board, verify ownership of target board
  const newBoardId = req.body.board_id ?? existing.board_id;
  if (newBoardId !== existing.board_id) {
    try {
      await assertBoardOwnership(newBoardId, req.user.sub);
    } catch (err) {
      if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
      if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
      return res.status(500).json({ error: 'Failed to verify board' });
    }
  }

  const updated = {
    ...existing,
    board_id: newBoardId,
    title: req.body.title.trim(),
    description: req.body.description?.trim() ?? existing.description,
    status: req.body.status ?? existing.status,
    priority: req.body.priority ?? existing.priority,
    due_date: req.body.due_date !== undefined ? req.body.due_date : existing.due_date,
    updated_at: new Date().toISOString(),
  };

  try {
    const result = await db.insert(updated);
    res.json({ ...updated, _rev: result.rev });
  } catch {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const db = getTasksDb();

  let existing;
  try {
    existing = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  if (existing.user_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

  try {
    await db.destroy(existing._id, existing._rev);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
