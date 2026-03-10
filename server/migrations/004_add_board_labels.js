/**
 * Migration 004: Add labels array to boards
 *
 * Adds an empty `labels` array to every board that lacks one.
 */
module.exports = {
  id: '004_add_board_labels',

  async up({ getBoardsDb }) {
    const boardsDb = getBoardsDb();

    const { rows } = await boardsDb.view('boards', 'by_user', { include_docs: true });
    const { rows: sharedRows } = await boardsDb.view('boards', 'by_shared_user', { include_docs: true });

    const seen = new Set();
    const allBoards = [];
    for (const r of [...rows, ...sharedRows]) {
      if (r.doc && r.doc.type === 'board' && !seen.has(r.doc._id)) {
        seen.add(r.doc._id);
        allBoards.push(r.doc);
      }
    }

    const toUpdate = allBoards.filter((b) => !b.labels);
    if (toUpdate.length > 0) {
      const docs = toUpdate.map((b) => ({ ...b, labels: [] }));
      await boardsDb.bulk({ docs });
      console.log(`Migration 004: added empty labels to ${toUpdate.length} board(s)`);
    } else {
      console.log('Migration 004: all boards already have labels');
    }
  },
};
