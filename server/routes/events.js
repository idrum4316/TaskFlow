const express = require('express');
const jwt = require('jsonwebtoken');
const { getBoardsDb } = require('../config/couch');
const { addClient, removeClient } = require('../events/changes');

const router = express.Router();

router.get('/', async (req, res) => {
  // Auth: support token in query param (EventSource can't set headers)
  const token = req.query.token || req.headers.authorization?.slice(7);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { board_id } = req.query;
  if (!board_id) return res.status(400).json({ error: 'board_id query parameter is required' });

  // Verify the user has access to this board
  try {
    const board = await getBoardsDb().get(board_id);
    const isOwner = board.user_id === user.sub;
    const hasShare = (board.shares || []).some(
      (s) => s.user_id === user.sub && s.status === 'accepted'
    );
    if (!isOwner && !hasShare) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Server error' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`event: connected\ndata: {}\n\n`);

  const clientId = addClient(res, { boardId: board_id, userId: user.sub });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(clientId);
  });
});

module.exports = router;
