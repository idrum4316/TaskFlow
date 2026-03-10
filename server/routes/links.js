const express = require('express');
const { getTasksDb, getBoardsDb } = require('../config/couch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

const VALID_RELATIONS = ['depends_on', 'related_to', 'subtask_of'];

async function assertBoardAccess(boardId, userId, requiredAccess = 'read') {
  const board = await getBoardsDb().get(boardId);
  if (board.user_id === userId) return board;
  const share = (board.shares || []).find(
    (s) => s.user_id === userId && s.status === 'accepted'
  );
  if (!share) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (requiredAccess === 'write' && share.access !== 'write') {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return board;
}

// GET /api/tasks/:id/links
router.get('/', async (req, res) => {
  const db = getTasksDb();
  let task;
  try {
    task = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(task.board_id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  try {
    const { rows } = await db.view('tasks', 'links_by_task', {
      key: req.params.id,
      include_docs: true,
    });
    const links = rows.map((r) => r.doc);

    // Collect all linked task IDs so we can return their titles
    const linkedTaskIds = new Set();
    for (const link of links) {
      linkedTaskIds.add(link.source_id === req.params.id ? link.target_id : link.source_id);
    }

    // Fetch linked task titles in bulk
    const taskTitles = {};
    if (linkedTaskIds.size) {
      const { rows: taskRows } = await db.fetch({ keys: [...linkedTaskIds] });
      for (const row of taskRows) {
        if (row.doc) taskTitles[row.doc._id] = row.doc.title;
      }
    }

    // Enrich links with the linked task title and effective direction
    const enriched = links.map((link) => {
      const isSource = link.source_id === req.params.id;
      const linkedTaskId = isSource ? link.target_id : link.source_id;
      return {
        _id: link._id,
        _rev: link._rev,
        relation: link.relation,
        direction: isSource ? 'outward' : 'inward',
        linked_task_id: linkedTaskId,
        linked_task_title: taskTitles[linkedTaskId] || '(deleted task)',
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// POST /api/tasks/:id/links
router.post('/', async (req, res) => {
  const { target_id, relation } = req.body;
  if (!target_id) return res.status(400).json({ error: 'target_id is required' });
  if (!relation || !VALID_RELATIONS.includes(relation)) {
    return res.status(400).json({ error: `relation must be one of: ${VALID_RELATIONS.join(', ')}` });
  }
  if (target_id === req.params.id) {
    return res.status(400).json({ error: 'A task cannot link to itself' });
  }

  const db = getTasksDb();

  // Verify source task
  let sourceTask;
  try {
    sourceTask = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(sourceTask.board_id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  // Verify target task exists and user has read access to its board
  let targetTask;
  try {
    targetTask = await db.get(target_id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Target task not found' });
    return res.status(500).json({ error: 'Failed to fetch target task' });
  }

  try {
    await assertBoardAccess(targetTask.board_id, req.user.sub);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify target board' });
  }

  // Check for duplicate link (same pair + relation in either direction)
  try {
    const { rows } = await db.view('tasks', 'links_by_task', {
      key: req.params.id,
      include_docs: true,
    });
    const duplicate = rows.some((r) => {
      const d = r.doc;
      if (d.relation !== relation) return false;
      return (
        (d.source_id === req.params.id && d.target_id === target_id) ||
        (d.source_id === target_id && d.target_id === req.params.id)
      );
    });
    if (duplicate) {
      return res.status(409).json({ error: 'This link already exists' });
    }
  } catch {
    // Non-critical — proceed and let CouchDB handle conflicts
  }

  const now = new Date().toISOString();
  const doc = {
    type: 'task_link',
    source_id: req.params.id,
    target_id,
    relation,
    board_id: sourceTask.board_id,
    created_by: req.user.sub,
    created_at: now,
  };

  try {
    const result = await db.insert(doc);
    res.status(201).json({
      _id: result.id,
      _rev: result.rev,
      relation,
      direction: 'outward',
      linked_task_id: target_id,
      linked_task_title: targetTask.title,
    });
  } catch {
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// DELETE /api/tasks/:id/links/:linkId
router.delete('/:linkId', async (req, res) => {
  const db = getTasksDb();

  // Verify the source task for board access
  let task;
  try {
    task = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(task.board_id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  let link;
  try {
    link = await db.get(req.params.linkId);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Link not found' });
    return res.status(500).json({ error: 'Failed to fetch link' });
  }

  if (link.type !== 'task_link') {
    return res.status(404).json({ error: 'Link not found' });
  }
  if (link.source_id !== req.params.id && link.target_id !== req.params.id) {
    return res.status(404).json({ error: 'Link not found' });
  }

  try {
    await db.destroy(link._id, link._rev);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

module.exports = router;
