const express = require('express');
const { getTasksDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function validateTask(body) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('title is required');
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  return errors;
}

// GET /api/tasks
router.get('/', async (req, res) => {
  const db = getTasksDb();
  const { status } = req.query;

  try {
    let docs;
    if (status && VALID_STATUSES.includes(status)) {
      const result = await db.view('tasks', 'by_user_and_status', {
        key: [req.user.sub, status],
        include_docs: true,
      });
      docs = result.rows.map((r) => r.doc);
    } else {
      const result = await db.view('tasks', 'by_user', {
        key: req.user.sub,
        include_docs: true,
      });
      docs = result.rows.map((r) => r.doc);
    }
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const errors = validateTask(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const now = new Date().toISOString();
  const doc = {
    type: 'task',
    user_id: req.user.sub,
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

  const updated = {
    ...existing,
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
