const express = require('express');
const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getTasksDb, getBoardsDb } = require('../config/couch');
const { s3, S3_BUCKET, isS3Available } = require('../config/s3');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const DEFAULT_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const POSITION_GAP = 10000;

function validateTask(body, requireBoardId = false, boardStatuses = null) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('title is required');
  if (requireBoardId && !body.board_id) errors.push('board_id is required');
  const validStatuses = boardStatuses
    ? boardStatuses.map((s) => s.id)
    : DEFAULT_STATUSES;
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  return errors;
}

async function assertBoardAccess(boardId, userId, requiredAccess = 'read') {
  const board = await getBoardsDb().get(boardId);
  if (board.user_id === userId) return board; // owner has full access

  const share = (board.shares || []).find(
    (s) => s.user_id === userId && s.status === 'accepted'
  );
  if (!share) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (requiredAccess === 'write' && share.access !== 'write') {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return board;
}

// GET /api/tasks?board_id=xxx[&status=todo]
router.get('/', async (req, res) => {
  const { board_id, status } = req.query;
  if (!board_id) return res.status(400).json({ error: 'board_id query parameter is required' });

  try {
    await assertBoardAccess(board_id, req.user.sub, 'read');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  const db = getTasksDb();
  try {
    let docs;
    if (status) {
      const { rows } = await db.view('tasks', 'by_board_and_status', {
        key: [board_id, status],
        include_docs: true,
      });
      docs = rows.map((r) => r.doc);
    } else {
      const { rows } = await db.view('tasks', 'by_board', {
        key: board_id,
        include_docs: true,
      });
      docs = rows.map((r) => r.doc);
    }

    // Enrich tasks with comment and attachment counts
    const taskIds = docs.map((d) => d._id);
    if (taskIds.length) {
      const [commentRows, attachmentRows] = await Promise.all([
        db.view('tasks', 'by_task', { keys: taskIds }).then((r) => r.rows),
        db.view('tasks', 'attachments_by_task', { keys: taskIds }).then((r) => r.rows),
      ]);
      const commentCounts = {};
      const attachmentCounts = {};
      for (const r of commentRows) commentCounts[r.key] = (commentCounts[r.key] || 0) + 1;
      for (const r of attachmentRows) attachmentCounts[r.key] = (attachmentCounts[r.key] || 0) + 1;
      for (const doc of docs) {
        doc.comment_count = commentCounts[doc._id] || 0;
        doc.attachment_count = attachmentCounts[doc._id] || 0;
      }
    }

    docs.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  let board;
  try {
    board = await assertBoardAccess(req.body.board_id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  const errors = validateTask(req.body, true, board.statuses);
  if (errors.length) return res.status(400).json({ errors });

  const defaultStatus = board.statuses?.[0]?.id || 'todo';
  const taskStatus = req.body.status || defaultStatus;

  // Compute position: append to end of status group
  let maxPosition = 0;
  try {
    const { rows } = await getTasksDb().view('tasks', 'by_board_and_status', {
      key: [req.body.board_id, taskStatus],
      include_docs: true,
    });
    for (const r of rows) {
      if (r.doc.position != null && r.doc.position > maxPosition) {
        maxPosition = r.doc.position;
      }
    }
  } catch { /* use 0 */ }

  const now = new Date().toISOString();
  const doc = {
    type: 'task',
    user_id: req.user.sub,
    board_id: req.body.board_id,
    title: req.body.title.trim(),
    description: req.body.description?.trim() || '',
    status: taskStatus,
    priority: req.body.priority || 'medium',
    due_date: req.body.due_date || null,
    labels: Array.isArray(req.body.labels) ? req.body.labels : [],
    position: maxPosition + POSITION_GAP,
    created_at: now,
    updated_at: now,
  };

  try {
    const result = await getTasksDb().insert(doc);
    res.status(201).json({ ...doc, _id: result.id, _rev: result.rev });
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  let doc;
  try {
    doc = await getTasksDb().get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }
  try {
    await assertBoardAccess(doc.board_id, req.user.sub, 'read');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }
  res.json(doc);
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const db = getTasksDb();
  let existing;
  try {
    existing = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  let board;
  try {
    board = await assertBoardAccess(existing.board_id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  const errors = validateTask(req.body, false, board.statuses);
  if (errors.length) return res.status(400).json({ errors });

  const newBoardId = req.body.board_id ?? existing.board_id;
  if (newBoardId !== existing.board_id) {
    try {
      await assertBoardAccess(newBoardId, req.user.sub, 'write');
    } catch (err) {
      if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
      if (err.statusCode === 404) return res.status(404).json({ error: 'Board not found' });
      return res.status(500).json({ error: 'Failed to verify board' });
    }
  }

  const updated = {
    ...existing,
    board_id: newBoardId,
    title: req.body.title.trim(),
    description: req.body.description?.trim() ?? existing.description,
    status: req.body.status ?? existing.status,
    priority: req.body.priority ?? existing.priority,
    due_date: req.body.due_date !== undefined ? req.body.due_date : existing.due_date,
    labels: Array.isArray(req.body.labels) ? req.body.labels : (existing.labels || []),
    position: req.body.position ?? existing.position ?? 0,
    updated_at: new Date().toISOString(),
  };

  try {
    const result = await db.insert(updated);
    res.json({ ...updated, _rev: result.rev });
  } catch {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const db = getTasksDb();
  let existing;
  try {
    existing = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(existing.board_id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  try {
    // Delete all attachments (S3 objects + CouchDB metadata)
    try {
      const { rows } = await db.view('tasks', 'attachments_by_task', {
        key: existing._id,
        include_docs: true,
      });
      if (rows.length > 0) {
        // Delete S3 objects in batch (only if S3 is available)
        if (isS3Available()) {
          const s3Keys = rows.map((r) => ({ Key: r.doc.s3_key }));
          await s3.send(new DeleteObjectsCommand({
            Bucket: S3_BUCKET,
            Delete: { Objects: s3Keys },
          }));
        }
        // Delete CouchDB attachment docs
        const bulkDocs = rows.map((r) => ({
          _id: r.doc._id,
          _rev: r.doc._rev,
          _deleted: true,
        }));
        await db.bulk({ docs: bulkDocs });
      }
    } catch (err) {
      console.error('Failed to clean up attachments:', err);
      // Continue with task deletion regardless
    }

    // Delete associated comments
    try {
      const { rows: commentRows } = await db.view('tasks', 'by_task', {
        key: existing._id,
        include_docs: true,
      });
      if (commentRows.length > 0) {
        const bulkDocs = commentRows.map((r) => ({
          _id: r.doc._id,
          _rev: r.doc._rev,
          _deleted: true,
        }));
        await db.bulk({ docs: bulkDocs });
      }
    } catch (err) {
      console.error('Failed to clean up comments:', err);
    }

    // Delete associated task links
    try {
      const { rows: linkRows } = await db.view('tasks', 'links_by_task', {
        key: existing._id,
        include_docs: true,
      });
      if (linkRows.length > 0) {
        const bulkDocs = linkRows.map((r) => ({
          _id: r.doc._id,
          _rev: r.doc._rev,
          _deleted: true,
        }));
        await db.bulk({ docs: bulkDocs });
      }
    } catch (err) {
      console.error('Failed to clean up task links:', err);
    }

    await db.destroy(existing._id, existing._rev);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// PUT /api/tasks/:id/reorder
router.put('/:id/reorder', async (req, res) => {
  const { status, position } = req.body;
  if (typeof position !== 'number') {
    return res.status(400).json({ error: 'position is required and must be a number' });
  }

  const db = getTasksDb();
  let existing;
  try {
    existing = await db.get(req.params.id);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(existing.board_id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  const targetStatus = status || existing.status;
  const updated = {
    ...existing,
    status: targetStatus,
    position,
    updated_at: new Date().toISOString(),
  };

  try {
    const result = await db.insert(updated);
    const saved = { ...updated, _rev: result.rev };

    // Check if renumbering is needed for the target status group
    const { rows } = await db.view('tasks', 'by_board_and_status', {
      key: [existing.board_id, targetStatus],
      include_docs: true,
    });
    const siblings = rows
      .map((r) => (r.doc._id === saved._id ? saved : r.doc))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    let needsRenumber = false;
    for (let i = 1; i < siblings.length; i++) {
      if (Math.abs((siblings[i].position ?? 0) - (siblings[i - 1].position ?? 0)) < 1) {
        needsRenumber = true;
        break;
      }
    }

    if (needsRenumber) {
      const bulkDocs = [];
      const renumbered = [];
      for (let i = 0; i < siblings.length; i++) {
        const newPos = (i + 1) * POSITION_GAP;
        if (siblings[i].position !== newPos) {
          siblings[i].position = newPos;
          siblings[i].updated_at = updated.updated_at;
          bulkDocs.push(siblings[i]);
          renumbered.push({ _id: siblings[i]._id, position: newPos });
        }
      }
      if (bulkDocs.length) {
        const bulkResult = await db.bulk({ docs: bulkDocs });
        // Update revs from bulk result
        for (const br of bulkResult) {
          if (br.ok) {
            const entry = renumbered.find((r) => r._id === br.id);
            if (entry) entry._rev = br.rev;
            if (br.id === saved._id) saved._rev = br.rev;
          }
        }
      }
      saved.position = renumbered.find((r) => r._id === saved._id)?.position ?? saved.position;
      res.json({ ...saved, renumbered });
    } else {
      res.json(saved);
    }
  } catch {
    res.status(500).json({ error: 'Failed to reorder task' });
  }
});

module.exports = router;
