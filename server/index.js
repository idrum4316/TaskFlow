require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./config/couch');
const { runMigrations } = require('./migrations/runner');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const taskRoutes = require('./routes/tasks');
const shareRoutes = require('./routes/shares');
const invitationRoutes = require('./routes/invitations');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/account');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/boards/:id/shares', shareRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks/:id/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

async function start() {
  await initDb();
  await runMigrations();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
