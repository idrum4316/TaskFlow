const { getTasksDb, getBoardsDb } = require('../config/couch');

const clients = new Map();
let nextClientId = 0;
let tasksFeedStarted = false;
let boardsFeedStarted = false;

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

function ensureFeeds() {
  if (!tasksFeedStarted) {
    tasksFeedStarted = true;
    const feed = getTasksDb().changesReader.start({ since: 'now', includeDocs: true, wait: true });

    feed.on('change', (change) => {
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

    feed.on('error', (err) => console.error('Tasks changes feed error:', err.message));
  }

  if (!boardsFeedStarted) {
    boardsFeedStarted = true;
    const feed = getBoardsDb().changesReader.start({ since: 'now', includeDocs: true, wait: true });

    feed.on('change', (change) => {
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

    feed.on('error', (err) => console.error('Boards changes feed error:', err.message));
  }
}

module.exports = { addClient, removeClient };
