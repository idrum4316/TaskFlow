module.exports = {
  id: '007_add_task_recurrence',
  async up({ getTasksDb }) {
    const tasksDb = getTasksDb();

    const { rows } = await tasksDb.view('tasks', 'by_board', { include_docs: true });

    const updates = [];
    const seen = new Set();
    for (const r of rows) {
      if (r.doc.type !== 'task') continue;
      if (seen.has(r.doc._id)) continue;
      seen.add(r.doc._id);
      if (r.doc.recurrence === undefined) {
        updates.push({ ...r.doc, recurrence: null });
      }
    }

    if (updates.length) {
      await tasksDb.bulk({ docs: updates });
    }
  },
};
