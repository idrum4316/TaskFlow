/**
 * Migration 005: Drop old invitation tokens
 *
 * Removes all existing invite_token documents from the settings database
 * so they can be recreated with the new email + expiry fields.
 */
module.exports = {
  id: '005_drop_old_invite_tokens',

  async up({ getSettingsDb }) {
    const db = getSettingsDb();

    const { rows } = await db.view('settings', 'invite_tokens', { include_docs: true });
    const docs = rows.map(r => ({ _id: r.doc._id, _rev: r.doc._rev }));

    if (docs.length > 0) {
      const toDelete = docs.map((d) => ({ ...d, _deleted: true }));
      await db.bulk({ docs: toDelete });
      console.log(`Migration 005: deleted ${docs.length} old invite token(s)`);
    } else {
      console.log('Migration 005: no old invite tokens to delete');
    }
  },
};
