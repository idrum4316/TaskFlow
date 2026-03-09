const nano = require('nano');

const COUCH_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
const COUCH_USER = process.env.COUCHDB_USER || 'admin';
const COUCH_PASSWORD = process.env.COUCHDB_PASSWORD || 'password';

const url = new URL(COUCH_URL);
url.username = COUCH_USER;
url.password = COUCH_PASSWORD;

const couch = nano(url.toString());

let usersDb;
let tasksDb;
let boardsDb;
let migrationsDb;

const TASK_DESIGN_DOC = {
  _id: '_design/tasks',
  views: {
    // Legacy: all tasks for a user (used by migrations)
    by_user: {
      map: `function (doc) {
        if (doc.type === 'task') {
          emit(doc.user_id, null);
        }
      }`,
    },
    // Primary: tasks for a board
    by_board: {
      map: `function (doc) {
        if (doc.type === 'task') {
          emit(doc.board_id, null);
        }
      }`,
    },
    // Tasks for a board filtered by status
    by_board_and_status: {
      map: `function (doc) {
        if (doc.type === 'task') {
          emit([doc.board_id, doc.status], null);
        }
      }`,
    },
    // Comments for a task
    by_task: {
      map: `function (doc) {
        if (doc.type === 'comment') {
          emit(doc.task_id, null);
        }
      }`,
    },
  },
};

const BOARD_DESIGN_DOC = {
  _id: '_design/boards',
  views: {
    by_user: {
      map: `function (doc) {
        if (doc.type === 'board') {
          emit(doc.user_id, null);
        }
      }`,
    },
    by_shared_user: {
      map: `function (doc) {
        if (doc.type === 'board' && doc.shares) {
          doc.shares.forEach(function(share) {
            if (share.status === 'accepted') {
              emit(share.user_id, null);
            }
          });
        }
      }`,
    },
    by_invitee: {
      map: `function (doc) {
        if (doc.type === 'board' && doc.shares) {
          doc.shares.forEach(function(share) {
            if (share.status === 'pending') {
              emit(share.user_id, null);
            }
          });
        }
      }`,
    },
  },
};

async function ensureDb(name) {
  try {
    await couch.db.create(name);
    console.log(`Created database: ${name}`);
  } catch (err) {
    if (err.statusCode !== 412) throw err; // 412 = already exists
  }
  return couch.use(name);
}

async function ensureDesignDoc(db, doc) {
  try {
    const existing = await db.get(doc._id);
    const updated = { ...doc, _rev: existing._rev };
    await db.insert(updated);
  } catch (err) {
    if (err.statusCode === 404) {
      await db.insert(doc);
    } else {
      throw err;
    }
  }
}

async function initDb() {
  usersDb = await ensureDb('todo_users');
  tasksDb = await ensureDb('todo_tasks');
  boardsDb = await ensureDb('todo_boards');
  migrationsDb = await ensureDb('todo_migrations');
  await ensureDesignDoc(tasksDb, TASK_DESIGN_DOC);
  await ensureDesignDoc(boardsDb, BOARD_DESIGN_DOC);
  console.log('Database initialised');
}

const getUsersDb = () => usersDb;
const getTasksDb = () => tasksDb;
const getBoardsDb = () => boardsDb;
const getMigrationsDb = () => migrationsDb;

module.exports = { initDb, getUsersDb, getTasksDb, getBoardsDb, getMigrationsDb };
