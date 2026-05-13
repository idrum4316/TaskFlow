module.exports = {
  id: '009_replace_list_view_with_table',
  async up({ getBoardsDb }) {
    const boardsDb = getBoardsDb();
    const { rows } = await boardsDb.view('boards', 'by_user', { include_docs: true });

    const now = new Date().toISOString();
    const updates = rows
      .map((r) => r.doc)
      .filter((doc) => doc?.type === 'board' && doc.default_view === 'list')
      .map((doc) => ({ ...doc, default_view: 'table', updated_at: now }));

    if (updates.length) {
      await boardsDb.bulk({ docs: updates });
    }
  },
};
