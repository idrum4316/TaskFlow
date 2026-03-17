const { getTasksDb, getBoardsDb } = require('../config/couch');

const clients = new Map();
let nextClientId = 0;
let tasksFeed = null;
let boardsFeed = null;

function sendEvent(res, event, data) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Client already disconnected
  }
}

function addClient(res, { boardId, userId }) {
  const id = ++nextClientId;
  clients.set(id, { res, boardId, userId });
  ensureFeeds();
  return id;
}

function removeClient(id) {
  clients.delete(id);
}

function startTasksFeed() {
  if (tasksFeed) {
    try { tasksFeed.stop(); } catch { /* already stopped */ }
  }

  tasksFeed = getTasksDb().changesReader.start({ since: 'now', includeDocs: true, wait: true });

  tasksFeed.on('change', (change) => {
    if (change.deleted) {
      for (const [, client] of clients) {
        sendEvent(client.res, 'change', { type: 'deleted', id: change.id });
      }
      return;
    }

    const doc = change.doc;
    if (!doc || !doc.board_id) return;

    for (const [, client] of clients) {
      if (client.boardId === doc.board_id) {
        sendEvent(client.res, 'change', {
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

  boardsFeed = getBoardsDb().changesReader.start({ since: 'now', includeDocs: true, wait: true });

  boardsFeed.on('change', (change) => {
    if (change.deleted) return;
    const doc = change.doc;
    if (!doc || doc.type !== 'board') return;

    for (const [, client] of clients) {
      if (client.boardId === change.id) {
        sendEvent(client.res, 'change', {
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

module.exports = { addClient, removeClient };
