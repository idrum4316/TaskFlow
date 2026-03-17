const express = require('express');
const { getBoardsDb, getUsersDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

const VALID_ACCESS = ['read', 'write'];

async function getOwnedBoard(boardId, userId) {
  const board = await getBoardsDb().get(boardId);
  if (board.user_id !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return board;
}

// GET /api/boards/:id/shares
router.get('/', async (req, res) => {
  try {
    const board = await getOwnedBoard(req.params.id, req.user.sub);
    res.json(board.shares || []);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// POST /api/boards/:id/shares — invite a user by email
router.post('/', async (req, res) => {
  const { email, access } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!VALID_ACCESS.includes(access)) return res.status(400).json({ error: 'access must be "read" or "write"' });

  const db = getBoardsDb();
  let board;
  try {
    board = await getOwnedBoard(req.params.id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to fetch board' });
  }

  let invitee;
  try {
    const result = await getUsersDb().view('users', 'by_email', { key: email, include_docs: true, limit: 1 });
    invitee = result.rows[0]?.doc;
  } catch {
    return res.status(500).json({ error: 'Failed to look up user' });
  }
  if (!invitee) return res.status(404).json({ error: 'No user found with that email address' });
  if (invitee._id === req.user.sub) return res.status(400).json({ error: 'You cannot share a board with yourself' });

  const shares = board.shares || [];
  if (shares.some((s) => s.user_id === invitee._id)) {
    return res.status(409).json({ error: 'This user already has an invitation to this board' });
  }

  const newShare = {
    user_id: invitee._id,
    email: invitee.email,
    username: invitee.username,
    access,
    status: 'pending',
    invited_at: new Date().toISOString(),
    responded_at: null,
  };

  try {
    const updated = { ...board, shares: [...shares, newShare] };
    await db.insert(updated);
    res.status(201).json(newShare);
  } catch {
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// PATCH /api/boards/:id/shares/:userId — update access level
router.patch('/:userId', async (req, res) => {
  const { access } = req.body;
  if (!VALID_ACCESS.includes(access)) return res.status(400).json({ error: 'access must be "read" or "write"' });

  const db = getBoardsDb();
  let board;
  try {
    board = await getOwnedBoard(req.params.id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to fetch board' });
  }

  const shares = board.shares || [];
  const idx = shares.findIndex((s) => s.user_id === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: 'Share not found' });

  const updatedShare = { ...shares[idx], access };
  const updatedShares = shares.map((s, i) => (i === idx ? updatedShare : s));
  try {
    await db.insert({ ...board, shares: updatedShares });
    res.json(updatedShare);
  } catch {
    res.status(500).json({ error: 'Failed to update access level' });
  }
});

// DELETE /api/boards/:id/shares/:userId — revoke access
router.delete('/:userId', async (req, res) => {
  const db = getBoardsDb();
  let board;
  try {
    board = await getOwnedBoard(req.params.id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to fetch board' });
  }

  const shares = board.shares || [];
  if (!shares.some((s) => s.user_id === req.params.userId)) {
    return res.status(404).json({ error: 'Share not found' });
  }

  try {
    await db.insert({ ...board, shares: shares.filter((s) => s.user_id !== req.params.userId) });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

module.exports = router;
