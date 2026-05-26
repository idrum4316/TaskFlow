const { Meilisearch } = require('meilisearch');

const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || '';

const meiliClient = new Meilisearch({ host, apiKey });

const INDEX_SETTINGS = {
  searchableAttributes: ['title', 'description', 'content', 'labels'],
  filterableAttributes: ['board_id', 'type', 'status', 'priority'],
  sortableAttributes: ['created_at', 'updated_at'],
};

async function assertTaskSucceeded(enqueued, label) {
  const task = await meiliClient.tasks.waitForTask(enqueued.taskUid);
  if (task.status !== 'succeeded') {
    const detail = task.error
      ? `${task.error.code}: ${task.error.message}`
      : `status=${task.status}`;
    throw new Error(`Meilisearch task failed [${label}] — ${detail}`);
  }
  return task;
}

async function ensureIndexes() {
  const indexNames = ['tasks', 'notes'];
  for (const name of indexNames) {
    try {
      const index = meiliClient.index(name);
      try {
        await index.fetchInfo();
      } catch (err) {
        if (err.statusCode === 404 || err.code === 'index_not_found') {
          const job = await meiliClient.createIndex(name, { primaryKey: 'id' });
          await assertTaskSucceeded(job, `createIndex(${name})`);
        } else {
          throw err;
        }
      }
      const job = await index.updateSettings(INDEX_SETTINGS);
      await assertTaskSucceeded(job, `updateSettings(${name})`);
      console.log(`Meilisearch index ready: ${name}`);
    } catch (err) {
      console.error(`Failed to ensure Meilisearch index ${name}:`, err.message);
    }
  }
}

module.exports = { meiliClient, ensureIndexes };
