module.exports = {
  id: '008_add_task_checklists',
  async up({ getTasksDb }) {
    const tasksDb = getTasksDb();

    const { rows } = await tasksDb.view('tasks', 'by_board', { include_docs: true });

    const updates = [];
    const seen = new Set();
    for (const r of rows) {
      if (r.doc.type !== 'task') continue;
      if (seen.has(r.doc._id)) continue;
      seen.add(r.doc._id);
      if (r.doc.checklist === undefined) {
        updates.push({ ...r.doc, checklist: [] });
      }
    }

    if (updates.length) {
      await tasksDb.bulk({ docs: updates });
    }
  },
};
