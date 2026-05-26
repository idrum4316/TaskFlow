const { getBoardsDb, getTasksDb } = require('../config/couch');
const { meiliClient } = require('../config/meili');

async function getAccessibleUserIds(board_id) {
  const board = await getBoardsDb().get(board_id);
  const ids = [board.user_id];
  for (const share of board.shares || []) {
    if (share.status === 'accepted') {
      ids.push(share.user_id);
    }
  }
  return ids;
}

async function indexTask(taskDoc) {
  try {
    const doc = {
      id: taskDoc._id,
      type: 'task',
      board_id: taskDoc.board_id,
      title: taskDoc.title,
      description: taskDoc.description || '',
      status: taskDoc.status,
      priority: taskDoc.priority,
      due_date: taskDoc.due_date || null,
      labels: taskDoc.labels || [],
      created_at: taskDoc.created_at,
      updated_at: taskDoc.updated_at,
      accessible_to: await getAccessibleUserIds(taskDoc.board_id),
    };
    await meiliClient.index('tasks').addDocuments([doc]);
  } catch (err) {
    console.error('Failed to index task:', err.message);
  }
}

async function indexNote(noteDoc) {
  try {
    const doc = {
      id: noteDoc._id,
      type: 'note',
      board_id: noteDoc.board_id,
      title: noteDoc.title,
      content: noteDoc.content || '',
      created_at: noteDoc.created_at,
      updated_at: noteDoc.updated_at,
      accessible_to: await getAccessibleUserIds(noteDoc.board_id),
    };
    await meiliClient.index('notes').addDocuments([doc]);
  } catch (err) {
    console.error('Failed to index note:', err.message);
  }
}

async function deleteIndexedTask(id) {
  try {
    await meiliClient.index('tasks').deleteDocument(id);
  } catch (err) {
    console.error('Failed to delete indexed task:', err.message);
  }
}

async function deleteIndexedNote(id) {
  try {
    await meiliClient.index('notes').deleteDocument(id);
  } catch (err) {
    console.error('Failed to delete indexed note:', err.message);
  }
}

async function reindexAll() {
  const boardsDb = getBoardsDb();
  const tasksDb = getTasksDb();

  // Build board access map
  const { rows: boardRows } = await boardsDb.list({ include_docs: true });
  const boardAccessMap = new Map();
  for (const row of boardRows) {
    const doc = row.doc;
    if (!doc || doc.type !== 'board') continue;
    const ids = [doc.user_id];
    for (const share of doc.shares || []) {
      if (share.status === 'accepted') ids.push(share.user_id);
    }
    boardAccessMap.set(doc._id, ids);
  }

  // Fetch all tasks
  const { rows: taskRows } = await tasksDb.list({ include_docs: true });
  const taskDocs = [];
  for (const row of taskRows) {
    const doc = row.doc;
    if (!doc || doc.type !== 'task') continue;
    taskDocs.push({
      id: doc._id,
      type: 'task',
      board_id: doc.board_id,
      title: doc.title,
      description: doc.description || '',
      status: doc.status,
      priority: doc.priority,
      due_date: doc.due_date || null,
      labels: doc.labels || [],
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      accessible_to: boardAccessMap.get(doc.board_id) || [doc.user_id],
    });
  }

  // Fetch all notes
  const noteDocs = [];
  for (const row of boardRows) {
    const doc = row.doc;
    if (!doc || doc.type !== 'board_note') continue;
    noteDocs.push({
      id: doc._id,
      type: 'note',
      board_id: doc.board_id,
      title: doc.title,
      content: doc.content || '',
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      accessible_to: boardAccessMap.get(doc.board_id) || [doc.user_id],
    });
  }

  // Clear indexes
  await meiliClient.index('tasks').deleteAllDocuments();
  await meiliClient.index('notes').deleteAllDocuments();

  // Batch add
  const BATCH_SIZE = 500;
  for (let i = 0; i < taskDocs.length; i += BATCH_SIZE) {
    await meiliClient.index('tasks').addDocuments(taskDocs.slice(i, i + BATCH_SIZE));
  }
  for (let i = 0; i < noteDocs.length; i += BATCH_SIZE) {
    await meiliClient.index('notes').addDocuments(noteDocs.slice(i, i + BATCH_SIZE));
  }

  return { tasks: taskDocs.length, notes: noteDocs.length };
}

module.exports = {
  getAccessibleUserIds,
  indexTask,
  indexNote,
  deleteIndexedTask,
  deleteIndexedNote,
  reindexAll,
};
