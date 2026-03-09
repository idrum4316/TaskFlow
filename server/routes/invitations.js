const express = require('express');
const { getBoardsDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/invitations — pending invitations for the current user
router.get('/', async (req, res) => {
  try {
    const { rows } = await getBoardsDb().view('boards', 'by_invitee', {
      key: req.user.sub,
      include_docs: true,
    });
    const invitations = rows
      .map((r) => {
        const share = (r.doc.shares || []).find(
          (s) => s.user_id === req.user.sub && s.status === 'pending'
        );
        if (!share) return null;
        return {
          board_id: r.doc._id,
          board_name: r.doc.name,
          access: share.access,
          invited_at: share.invited_at,
        };
      })
      .filter(Boolean);
    res.json(invitations);
  } catch {
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// POST /api/invitations/:boardId/accept
router.post('/:boardId/accept', (req, res) => respond(req, res, 'accepted'));

// POST /api/invitations/:boardId/decline
router.post('/:boardId/decline', (req, res) => respond(req, res, 'declined'));

async function respond(req, res, newStatus) {
  const db = getBoardsDb();
  let board;
  try {
    board = await db.get(req.params.boardId);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to fetch board' });
  }

  const shares = board.shares || [];
  const idx = shares.findIndex((s) => s.user_id === req.user.sub && s.status === 'pending');
  if (idx === -1) return res.status(404).json({ error: 'Invitation not found' });

  // On decline, remove the entry entirely; on accept, update status
  let updatedShares;
  if (newStatus === 'declined') {
    updatedShares = shares.filter((_, i) => i !== idx);
  } else {
    updatedShares = shares.map((s, i) =>
      i === idx ? { ...s, status: 'accepted', responded_at: new Date().toISOString() } : s
    );
  }

  try {
    await db.insert({ ...board, shares: updatedShares });
    res.json({ status: newStatus });
  } catch {
    res.status(500).json({ error: 'Failed to respond to invitation' });
  }
}

module.exports = router;
