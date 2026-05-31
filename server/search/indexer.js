const { getBoardsDb, getTasksDb } = require('../config/couch');
const { meiliClient } = require('../config/meili');

// Wait for a Meilisearch EnqueuedTask to reach a terminal state and throw a
// descriptive error if it did not succeed.  waitForTask() resolves on *any*
// terminal status (succeeded | failed | canceled), so callers that omit this
// check silently swallow failures.
async function assertTaskSucceeded(enqueued, label) {
  const task = await meiliClient.tasks.waitForTask(enqueued.taskUid);
  if (task.status !== 'succeeded') {
    const detail = task.error
      ? `${task.error.code}: ${task.error.message}`
      : `status=${task.status}`;
    throw new Error(`Meilisearch task failed [${label}] — ${detail}`);
  }
  return task;
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
    };
    await meiliClient.index('tasks').addDocuments([doc], { primaryKey: 'id' });
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
      pinned: !!noteDoc.pinned,
      created_at: noteDoc.created_at,
      updated_at: noteDoc.updated_at,
    };
    await meiliClient.index('notes').addDocuments([doc], { primaryKey: 'id' });
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
    });
  }

  // Fetch all notes (stored as board_note docs in the boards DB)
  const { rows: boardRows } = await boardsDb.list({ include_docs: true });
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
      pinned: !!doc.pinned,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    });
  }

  // Clear both indexes and wait for deletions to fully complete before
  // re-populating.  If either deletion fails, throw immediately rather than
  // pushing documents into a broken index.
  const [deleteTasksJob, deleteNotesJob] = await Promise.all([
    meiliClient.index('tasks').deleteAllDocuments(),
    meiliClient.index('notes').deleteAllDocuments(),
  ]);
  await Promise.all([
    assertTaskSucceeded(deleteTasksJob, 'deleteAllDocuments(tasks)'),
    assertTaskSucceeded(deleteNotesJob, 'deleteAllDocuments(notes)'),
  ]);

  // Enqueue all batch-add operations, collecting their completion promises,
  // then wait for every batch to fully land before returning the count.
  const BATCH_SIZE = 500;
  const addJobs = [];
  for (let i = 0; i < taskDocs.length; i += BATCH_SIZE) {
    const job = await meiliClient.index('tasks').addDocuments(taskDocs.slice(i, i + BATCH_SIZE), { primaryKey: 'id' });
    addJobs.push(assertTaskSucceeded(job, `addDocuments(tasks, offset=${i})`));
  }
  for (let i = 0; i < noteDocs.length; i += BATCH_SIZE) {
    const job = await meiliClient.index('notes').addDocuments(noteDocs.slice(i, i + BATCH_SIZE), { primaryKey: 'id' });
    addJobs.push(assertTaskSucceeded(job, `addDocuments(notes, offset=${i})`));
  }
  await Promise.all(addJobs);

  return { tasks: taskDocs.length, notes: noteDocs.length };
}

module.exports = {
  indexTask,
  indexNote,
  deleteIndexedTask,
  deleteIndexedNote,
  reindexAll,
};
