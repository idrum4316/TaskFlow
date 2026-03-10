const express = require('express');
const { getBoardsDb, getTasksDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/boards — list all boards: owned + accepted-shared
router.get('/', async (req, res) => {
  try {
    const db = getBoardsDb();
    const [ownedResult, sharedResult] = await Promise.all([
      db.view('boards', 'by_user', { key: req.user.sub, include_docs: true }),
      db.view('boards', 'by_shared_user', { key: req.user.sub, include_docs: true }),
    ]);

    const ownedBoards = ownedResult.rows.map((r) => ({ ...r.doc, _role: 'owner' }));
    const sharedBoards = sharedResult.rows.map((r) => {
      const share = (r.doc.shares || []).find(
        (s) => s.user_id === req.user.sub && s.status === 'accepted'
      );
      // Strip shares array from non-owner responses
      const { shares: _, ...rest } = r.doc;
      return { ...rest, _role: 'shared', _access: share?.access ?? 'read' };
    });

    res.json([...ownedBoards, ...sharedBoards]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// POST /api/boards — create a new board
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const DEFAULT_STATUSES = [
    { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
    { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
    { id: 'done', label: 'Done', color: '#10b981', done: true },
  ];

  const now = new Date().toISOString();
  const doc = {
    type: 'board',
    user_id: req.user.sub,
    name: name.trim(),
    shares: [],
    statuses: DEFAULT_STATUSES,
    created_at: now,
    updated_at: now,
  };

  try {
    const result = await getBoardsDb().insert(doc);
    res.status(201).json({ ...doc, _id: result.id, _rev: result.rev, _role: 'owner' });
  } catch {
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// PUT /api/boards/:id — update board name and/or statuses (owner only)
router.put('/:id', async (req, res) => {
  const { name, statuses } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  // Validate statuses if provided
  if (statuses !== undefined) {
    if (!Array.isArray(statuses) || statuses.length === 0) {
      return res.status(400).json({ error: 'statuses must be a non-empty array' });
    }
    const ids = new Set();
    for (const s of statuses) {
      if (!s.id || !s.label || !s.color || typeof s.done !== 'boolean') {
        return res.status(400).json({ error: 'Each status must have id, label, color, and done (boolean)' });
      }
      if (!/^[a-z0-9-]+$/.test(s.id)) {
        return res.status(400).json({ error: 'Status id must contain only lowercase letters, numbers, and hyphens' });
      }
      if (ids.has(s.id)) {
        return res.status(400).json({ error: `Duplicate status id: ${s.id}` });
      }
      ids.add(s.id);
    }
  }

  const db = getBoardsDb();
  let existing;
  try {
    existing = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to fetch board' });
  }

  if (existing.user_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

  const updated = {
    ...existing,
    name: name.trim(),
    ...(statuses !== undefined && { statuses }),
    updated_at: new Date().toISOString(),
  };
  try {
    const result = await db.insert(updated);
    res.json({ ...updated, _rev: result.rev, _role: 'owner' });
  } catch {
    res.status(500).json({ error: 'Failed to update board' });
  }
});

// DELETE /api/boards/:id — delete board and all its tasks (owner only)
router.delete('/:id', async (req, res) => {
  const boardsDb = getBoardsDb();
  const tasksDb = getTasksDb();

  let existing;
  try {
    existing = await boardsDb.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to fetch board' });
  }

  if (existing.user_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { rows } = await tasksDb.view('tasks', 'by_board', {
      key: req.params.id,
      include_docs: true,
    });
    if (rows.length > 0) {
      const deletions = rows.map((r) => ({ _id: r.doc._id, _rev: r.doc._rev, _deleted: true }));
      await tasksDb.bulk({ docs: deletions });
    }
  } catch {
    return res.status(500).json({ error: 'Failed to delete board tasks' });
  }

  try {
    await boardsDb.destroy(existing._id, existing._rev);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

module.exports = router;
