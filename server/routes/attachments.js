const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getTasksDb, getBoardsDb } = require('../config/couch');
const { s3, S3_BUCKET, isS3Available } = require('../config/s3');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

// Guard: reject all attachment requests when S3 is not available
router.use((_req, res, next) => {
  if (!isS3Available()) {
    return res.status(503).json({ error: 'File storage is not available' });
  }
  next();
});

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_ATTACHMENTS_PER_TASK = 10;
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
]);
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIMETYPES.has(file.mimetype)) {
      return cb(new Error(`File type not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(', ')}`));
    }
    cb(null, true);
  },
});

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

// Helper: get attachment count for a task
async function getAttachmentCount(taskId) {
  const db = getTasksDb();
  const { rows } = await db.view('tasks', 'attachments_by_task', {
    key: taskId,
    include_docs: false,
  });
  return rows.length;
}

// GET /api/tasks/:id/attachments — list attachments for a task
router.get('/', async (req, res) => {
  const taskId = req.params.id;
  const db = getTasksDb();

  let task;
  try {
    task = await db.get(taskId);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Task not found' });
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(task.board_id, req.user.sub, 'read');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  try {
    const { rows } = await db.view('tasks', 'attachments_by_task', {
      key: taskId,
      include_docs: true,
    });
    res.json(rows.map((r) => r.doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// POST /api/tasks/:id/attachments — upload an attachment
router.post('/', upload.single('file'), async (req, res) => {
  const taskId = req.params.id;
  const db = getTasksDb();

  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  let task;
  try {
    task = await db.get(taskId);
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

  // Check attachment limit
  try {
    const count = await getAttachmentCount(taskId);
    if (count >= MAX_ATTACHMENTS_PER_TASK) {
      return res.status(400).json({
        error: `Maximum ${MAX_ATTACHMENTS_PER_TASK} attachments per task reached`,
      });
    }
  } catch {
    return res.status(500).json({ error: 'Failed to check attachment limit' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const s3Key = `${taskId}/${crypto.randomUUID()}${ext}`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));
  } catch (err) {
    console.error('S3 upload error:', err);
    return res.status(500).json({ error: 'Failed to upload file' });
  }

  const now = new Date().toISOString();
  const doc = {
    type: 'attachment',
    task_id: taskId,
    board_id: task.board_id,
    user_id: req.user.sub,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    s3_key: s3Key,
    created_at: now,
  };

  try {
    const result = await db.insert(doc);
    res.status(201).json({ ...doc, _id: result.id, _rev: result.rev });
  } catch (err) {
    // Try to clean up the uploaded file
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }));
    } catch { /* best effort */ }
    console.error(err);
    res.status(500).json({ error: 'Failed to save attachment metadata' });
  }
});

// GET /api/tasks/:id/attachments/:attachmentId/download — get presigned download URL
router.get('/:attachmentId/download', async (req, res) => {
  const { id: taskId, attachmentId } = req.params;
  const db = getTasksDb();

  let attachment;
  try {
    attachment = await db.get(attachmentId);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Attachment not found' });
    return res.status(500).json({ error: 'Failed to fetch attachment' });
  }

  if (attachment.type !== 'attachment' || attachment.task_id !== taskId) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  let task;
  try {
    task = await db.get(taskId);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(task.board_id, req.user.sub, 'read');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  try {
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: attachment.s3_key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
    }), { expiresIn: 3600 });
    res.json({ url });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// DELETE /api/tasks/:id/attachments/:attachmentId — delete an attachment
router.delete('/:attachmentId', async (req, res) => {
  const { id: taskId, attachmentId } = req.params;
  const db = getTasksDb();

  let attachment;
  try {
    attachment = await db.get(attachmentId);
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Attachment not found' });
    return res.status(500).json({ error: 'Failed to fetch attachment' });
  }

  if (attachment.type !== 'attachment' || attachment.task_id !== taskId) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  let task;
  try {
    task = await db.get(taskId);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch task' });
  }

  try {
    await assertBoardAccess(task.board_id, req.user.sub, 'write');
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to verify board' });
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: attachment.s3_key }));
  } catch (err) {
    console.error('S3 delete error:', err);
    // Continue to remove metadata regardless
  }

  try {
    await db.destroy(attachment._id, attachment._rev);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Multer error handler
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
