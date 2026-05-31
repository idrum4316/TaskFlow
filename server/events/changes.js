const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { getTasksDb, getBoardsDb } = require('../config/couch');

const clients = new Map();
let nextClientId = 0;
let tasksFeed = null;
let boardsFeed = null;

function send(ws, event, data) {
  if (ws.readyState === ws.OPEN) {
    try {
      ws.send(JSON.stringify({ event, ...data }));
    } catch {
      // Client already disconnected
    }
  }
}

function startTasksFeed() {
  if (tasksFeed) {
    try { tasksFeed.stop(); } catch { /* already stopped */ }
  }

  tasksFeed = getTasksDb().changesReader.start({ since: 'now', includeDocs: true, wait: false });

  tasksFeed.on('change', (change) => {
    if (change.deleted) {
      for (const [, client] of clients) {
        send(client.ws, 'change', { type: 'deleted', id: change.id });
      }
      return;
    }

    const doc = change.doc;
    if (!doc || !doc.board_id) return;

    for (const [, client] of clients) {
      if (client.boardId === doc.board_id) {
        send(client.ws, 'change', {
          type: doc.type,
          action: 'upsert',
          id: change.id,
          doc,
        });
      }
    }
  });

  tasksFeed.on('error', (err) => {
    console.error('Tasks changes feed error:', err.message);
    tasksFeed = null;
    if (clients.size > 0) {
      setTimeout(() => ensureFeeds(), 3000);
    }
  });
}

function startBoardsFeed() {
  if (boardsFeed) {
    try { boardsFeed.stop(); } catch { /* already stopped */ }
  }

  boardsFeed = getBoardsDb().changesReader.start({ since: 'now', includeDocs: true, wait: false });

  boardsFeed.on('change', (change) => {
    if (change.deleted) {
      for (const [, client] of clients) {
        send(client.ws, 'change', { type: 'deleted', id: change.id });
      }
      return;
    }

    const doc = change.doc;
    if (!doc) return;

    if (doc.type === 'board_note') {
      for (const [, client] of clients) {
        if (client.boardId === doc.board_id) {
          send(client.ws, 'change', {
            type: 'board_note',
            action: 'upsert',
            id: change.id,
            doc,
          });
        }
      }
      return;
    }

    if (doc.type !== 'board') return;

    for (const [, client] of clients) {
      if (client.boardId === change.id) {
        send(client.ws, 'change', {
          type: 'board',
          action: 'upsert',
          id: change.id,
          doc,
        });
      }
    }
  });

  boardsFeed.on('error', (err) => {
    console.error('Boards changes feed error:', err.message);
    boardsFeed = null;
    if (clients.size > 0) {
      setTimeout(() => ensureFeeds(), 3000);
    }
  });
}

function ensureFeeds() {
  if (!tasksFeed) startTasksFeed();
  if (!boardsFeed) startBoardsFeed();
}

async function verifyBoardAccess(user, boardId) {
  const board = await getBoardsDb().get(boardId);
  const isOwner = board.user_id === user.sub;
  const hasShare = (board.shares || []).some(
    (s) => s.user_id === user.sub && s.status === 'accepted'
  );
  return isOwner || hasShare;
}

function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Ping every 30s — detect and terminate dead connections
  const pingInterval = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => clearInterval(pingInterval));

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // Wait for a subscribe message with auth + board
    ws.once('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        ws.close(4400, 'Invalid message');
        return;
      }

      if (msg.type !== 'subscribe' || !msg.token || !msg.boardId) {
        ws.close(4400, 'Expected subscribe message with token and boardId');
        return;
      }

      let user;
      try {
        user = jwt.verify(msg.token, process.env.JWT_SECRET);
      } catch {
        ws.close(4401, 'Invalid or expired token');
        return;
      }

      try {
        if (!await verifyBoardAccess(user, msg.boardId)) {
          ws.close(4403, 'Forbidden');
          return;
        }
      } catch (err) {
        ws.close(err.statusCode === 404 ? 4404 : 4500, 'Board access error');
        return;
      }

      const clientId = ++nextClientId;
      clients.set(clientId, { ws, boardId: msg.boardId, userId: user.sub });
      ensureFeeds();

      send(ws, 'connected', {});

      ws.on('close', () => {
        clients.delete(clientId);
      });
    });
  });
}

module.exports = { attachWebSocketServer };
