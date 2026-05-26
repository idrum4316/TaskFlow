const { getBoardsDb, getTasksDb } = require('../config/couch');
const { meiliClient } = require('../config/meili');

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
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    });
  }

  // Clear both indexes, then wait for the deletions to fully complete before
  // re-populating. Meilisearch operations are async on the server side — each
  // call returns an EnqueuedTask whose taskUid we must poll until the work is
  // actually done, otherwise addDocuments batches may land before (or during)
  // the delete, and searches return zero results in the interim.
  const [deleteTasksJob, deleteNotesJob] = await Promise.all([
    meiliClient.index('tasks').deleteAllDocuments(),
    meiliClient.index('notes').deleteAllDocuments(),
  ]);
  await Promise.all([
    meiliClient.waitForTask(deleteTasksJob.taskUid),
    meiliClient.waitForTask(deleteNotesJob.taskUid),
  ]);

  // Enqueue all batch-add operations, collecting their task UIDs as we go,
  // then wait for every batch to be fully indexed before returning.
  const BATCH_SIZE = 500;
  const addJobs = [];
  for (let i = 0; i < taskDocs.length; i += BATCH_SIZE) {
    const job = await meiliClient.index('tasks').addDocuments(taskDocs.slice(i, i + BATCH_SIZE));
    addJobs.push(meiliClient.waitForTask(job.taskUid));
  }
  for (let i = 0; i < noteDocs.length; i += BATCH_SIZE) {
    const job = await meiliClient.index('notes').addDocuments(noteDocs.slice(i, i + BATCH_SIZE));
    addJobs.push(meiliClient.waitForTask(job.taskUid));
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
