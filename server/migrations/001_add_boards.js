/**
 * Migration 001: Add boards
 *
 * Creates a default "My Tasks" board for every existing user and assigns
 * all tasks that lack a board_id to that board.
 */
module.exports = {
  id: '001_add_boards',

  async up({ getUsersDb, getTasksDb, getBoardsDb }) {
    const usersDb = getUsersDb();
    const tasksDb = getTasksDb();
    const boardsDb = getBoardsDb();

    const { rows } = await usersDb.view('users', 'all', { include_docs: true });
    const users = rows.map(r => r.doc);
    console.log(`Migration 001: processing ${users.length} user(s)`);

    for (const user of users) {
      const now = new Date().toISOString();

      // Create the default board for this user
      const boardResult = await boardsDb.insert({
        type: 'board',
        user_id: user._id,
        name: 'My Tasks',
        created_at: now,
        updated_at: now,
      });

      // Find all tasks for this user that have no board_id
      const { rows } = await tasksDb.view('tasks', 'by_user', {
        key: user._id,
        include_docs: true,
      });

      const unassigned = rows.filter((r) => !r.doc.board_id).map((r) => ({
        ...r.doc,
        board_id: boardResult.id,
      }));

      if (unassigned.length > 0) {
        await tasksDb.bulk({ docs: unassigned });
        console.log(`Migration 001: assigned ${unassigned.length} task(s) to board for user ${user._id}`);
      }
    }
  },
};
