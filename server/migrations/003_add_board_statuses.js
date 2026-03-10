/**
 * Migration 003: Add custom statuses to boards
 *
 * Adds a default `statuses` array to every board that lacks one.
 * Each status has an id, label, and color.
 */
module.exports = {
  id: '003_add_board_statuses',

  async up({ getBoardsDb }) {
    const boardsDb = getBoardsDb();

    const DEFAULT_STATUSES = [
      { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
      { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
      { id: 'done', label: 'Done', color: '#10b981', done: true },
    ];

    const { rows } = await boardsDb.view('boards', 'by_user', { include_docs: true });
    // Also grab shared boards
    const { rows: sharedRows } = await boardsDb.view('boards', 'by_shared_user', { include_docs: true });

    const seen = new Set();
    const allBoards = [];
    for (const r of [...rows, ...sharedRows]) {
      if (r.doc && r.doc.type === 'board' && !seen.has(r.doc._id)) {
        seen.add(r.doc._id);
        allBoards.push(r.doc);
      }
    }

    const toUpdate = allBoards.filter((b) => !b.statuses);
    if (toUpdate.length > 0) {
      const docs = toUpdate.map((b) => ({ ...b, statuses: DEFAULT_STATUSES }));
      await boardsDb.bulk({ docs });
      console.log(`Migration 003: added default statuses to ${toUpdate.length} board(s)`);
    } else {
      console.log('Migration 003: all boards already have statuses');
    }
  },
};
