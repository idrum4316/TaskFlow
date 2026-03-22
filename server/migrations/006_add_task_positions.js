const POSITION_GAP = 10000;

module.exports = {
  id: '006_add_task_positions',
  async up({ getTasksDb, getBoardsDb }) {
    const tasksDb = getTasksDb();
    const boardsDb = getBoardsDb();

    // Get all boards
    const { rows: boardRows } = await boardsDb.view('boards', 'by_user', { include_docs: true });
    const boardIds = new Set(boardRows.map((r) => r.doc._id));

    // Also include boards found via shared_user view
    const { rows: sharedRows } = await boardsDb.view('boards', 'by_shared_user', { include_docs: true });
    for (const r of sharedRows) boardIds.add(r.doc._id);

    for (const boardId of boardIds) {
      const { rows } = await tasksDb.view('tasks', 'by_board', {
        key: boardId,
        include_docs: true,
      });

      // Group tasks by status
      const byStatus = {};
      for (const r of rows) {
        const status = r.doc.status;
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(r.doc);
      }

      const updates = [];
      for (const [, tasks] of Object.entries(byStatus)) {
        // Sort by created_at for deterministic initial ordering
        tasks.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].position == null) {
            updates.push({ ...tasks[i], position: i * POSITION_GAP });
          }
        }
      }

      if (updates.length) {
        await tasksDb.bulk({ docs: updates });
      }
    }
  },
};
