const express = require('express');
const { getBoardsDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

async function assertBoardAccess(boardId, userId, requiredAccess = 'read') {
  const board = await getBoardsDb().get(boardId);
  if (board.user_id === userId) return board;

  const share = (board.shares || []).find(
    (s) => s.user_id === userId && s.status === 'accepted'
  );
  if (!share) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (requiredAccess === 'write' && share.access !== 'write') {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return board;
}

// GET /api/boards/:id/notes
router.get('/', async (req, res) => {
  try {
    await assertBoardAccess(req.params.id, req.user.sub, 'read');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board access' });
  }

  try {
    const db = getBoardsDb();
    const { rows } = await db.view('boards', 'notes_by_board', {
      key: req.params.id,
      include_docs: true,
    });
    const notes = rows
      .map((r) => r.doc)
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at) * -1);
    res.json(notes);
  } catch {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/boards/:id/notes/:noteId
router.get('/:noteId', async (req, res) => {
  try {
    await assertBoardAccess(req.params.id, req.user.sub, 'read');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board access' });
  }

  try {
    const db = getBoardsDb();
    const note = await db.get(req.params.noteId);
    if (note.type !== 'board_note' || note.board_id !== req.params.id) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Note not found' });
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/boards/:id/notes
router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });

  try {
    await assertBoardAccess(req.params.id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board access' });
  }

  const now = new Date().toISOString();
  const doc = {
    type: 'board_note',
    board_id: req.params.id,
    user_id: req.user.sub,
    username: req.user.username,
    title: title.trim(),
    content: (content || '').trim(),
    created_at: now,
    updated_at: now,
  };

  try {
    const db = getBoardsDb();
    const result = await db.insert(doc);
    res.status(201).json({ ...doc, _id: result.id, _rev: result.rev });
  } catch {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/boards/:id/notes/:noteId
router.put('/:noteId', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });

  try {
    await assertBoardAccess(req.params.id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board access' });
  }

  try {
    const db = getBoardsDb();
    const existing = await db.get(req.params.noteId);
    if (existing.type !== 'board_note' || existing.board_id !== req.params.id) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updated = {
      ...existing,
      title: title.trim(),
      content: (content || '').trim(),
      updated_at: new Date().toISOString(),
    };

    const result = await db.insert(updated);
    res.json({ ...updated, _rev: result.rev });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Note not found' });
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/boards/:id/notes/:noteId
router.delete('/:noteId', async (req, res) => {
  let board;
  try {
    board = await assertBoardAccess(req.params.id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board access' });
  }

  try {
    const db = getBoardsDb();
    const note = await db.get(req.params.noteId);
    if (note.type !== 'board_note' || note.board_id !== req.params.id) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only note author or board owner can delete
    const isBoardOwner = board.user_id === req.user.sub;
    const isAuthor = note.user_id === req.user.sub;
    if (!isBoardOwner && !isAuthor) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.destroy(note._id, note._rev);
    res.status(204).end();
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Note not found' });
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
