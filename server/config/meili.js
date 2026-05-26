const { Meilisearch } = require('meilisearch');

const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || '';

const meiliClient = new Meilisearch({ host, apiKey });

const INDEX_SETTINGS = {
  searchableAttributes: ['title', 'description', 'content', 'labels'],
  filterableAttributes: ['accessible_to', 'board_id', 'type', 'status', 'priority'],
  sortableAttributes: ['created_at', 'updated_at'],
};

async function ensureIndexes() {
  const indexNames = ['tasks', 'notes'];
  for (const name of indexNames) {
    try {
      const index = meiliClient.index(name);
      try {
        await index.fetchInfo();
      } catch (err) {
        if (err.statusCode === 404 || err.code === 'index_not_found') {
          await meiliClient.createIndex(name, { primaryKey: 'id' });
        } else {
          throw err;
        }
      }
      await index.updateSettings(INDEX_SETTINGS);
      console.log(`Meilisearch index ready: ${name}`);
    } catch (err) {
      console.error(`Failed to ensure Meilisearch index ${name}:`, err.message);
    }
  }
}

module.exports = { meiliClient, ensureIndexes };
