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

const TASK_DESIGN_DOC = {
  _id: '_design/tasks',
  views: {
    by_user: {
      map: `function (doc) {
        if (doc.type === 'task') {
          emit(doc.user_id, null);
        }
      }`,
    },
    by_user_and_status: {
      map: `function (doc) {
        if (doc.type === 'task') {
          emit([doc.user_id, doc.status], null);
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
  await ensureDesignDoc(tasksDb, TASK_DESIGN_DOC);
  console.log('Database initialised');
}

function getUsersDb() {
  return usersDb;
}

function getTasksDb() {
  return tasksDb;
}

module.exports = { initDb, getUsersDb, getTasksDb };
