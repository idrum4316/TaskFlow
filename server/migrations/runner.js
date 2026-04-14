const { getMigrationsDb, getUsersDb, getTasksDb, getBoardsDb, getSettingsDb } = require('../config/couch');

// Register migrations in order here
const migrations = [
  require('./001_add_boards'),
  require('./002_add_admin_field'),
  require('./003_add_board_statuses'),
  require('./004_add_board_labels'),
  require('./005_drop_old_invite_tokens'),
  require('./006_add_task_positions'),
  require('./007_add_task_recurrence'),
];

async function runMigrations() {
  const db = getMigrationsDb();
  const context = { getUsersDb, getTasksDb, getBoardsDb, getSettingsDb };

  for (const migration of migrations) {
    try {
      await db.get(migration.id);
      // Document exists → already ran
    } catch (err) {
      if (err.statusCode !== 404) throw err;

      console.log(`Running migration: ${migration.id}`);
      await migration.up(context);
      await db.insert({ _id: migration.id, ran_at: new Date().toISOString() });
      console.log(`Completed migration: ${migration.id}`);
    }
  }
}

module.exports = { runMigrations };
