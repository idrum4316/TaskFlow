const { Meilisearch } = require('meilisearch');

const DEFAULT_HOST = 'http://localhost:7700';
const DEFAULT_PORT = '7700';

// Normalise a single Meilisearch endpoint value.
//
// Rules:
//   - A value that already carries a scheme keeps its own default port
//     (80 for http, 443 for https) and any path it has. Meilisearch's 7700 is
//     only added to a bare host, where it is the documented default.
//   - A bare IPv6 literal is bracketed before parsing, since `http://::1` is
//     not a valid URL.
//   - A value that cannot be parsed is passed through with a warning.
function normaliseHost(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);

  // Bare IPv6 literal (e.g. "::1" or "fe80::1"): two or more colons and no
  // brackets. A single colon is a host:port pair, not IPv6.
  const colonCount = (trimmed.match(/:/g) || []).length;
  if (!hasScheme && !trimmed.startsWith('[') && colonCount >= 2) {
    return `http://[${trimmed}]:${DEFAULT_PORT}`;
  }

  let url;
  try {
    url = new URL(hasScheme ? trimmed : `http://${trimmed}`);
  } catch {
    console.warn(`Could not parse Meilisearch host "${trimmed}" — using it unchanged`);
    return trimmed;
  }

  // Only a bare host gets Meilisearch's default port; a URL that declares a
  // scheme already implies 80 (http) or 443 (https).
  if (!hasScheme && !url.port) url.port = DEFAULT_PORT;

  return url.toString().replace(/\/+$/, '');
}

// Resolve the Meilisearch endpoint from the environment.
//
// Two variables can point at the instance:
//   MEILISEARCH_URL  — the full URL (preferred)
//   MEILISEARCH_HOST — a host or URL
//
// The container environment may already define MEILISEARCH_HOST as a bare
// hostname (no scheme, no port) while MEILISEARCH_URL holds the full URL.
// dotenv does not override pre-existing process.env values, so a good
// MEILISEARCH_HOST in .env can be shadowed by the container value — which
// would make every request go to port 80 and fail. Prefer MEILISEARCH_URL
// when it is set.
function resolveHost() {
  const fromUrl = normaliseHost(process.env.MEILISEARCH_URL);
  const fromHost = normaliseHost(process.env.MEILISEARCH_HOST);

  if (fromUrl && fromHost && fromUrl !== fromHost) {
    console.warn(
      `Meilisearch host mismatch: MEILISEARCH_URL resolves to ${fromUrl} but ` +
        `MEILISEARCH_HOST resolves to ${fromHost} — using MEILISEARCH_URL`
    );
  }

  return fromUrl || fromHost || DEFAULT_HOST;
}

const host = resolveHost();
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

// meilisearch-js exposes API errors with the payload on `cause`
// ({ message, code, type, link }) and the HTTP status on `response.status`.
// Older versions exposed `code`/`statusCode` directly, so check both.
function isIndexNotFound(err) {
  const status = err.response?.status ?? err.statusCode;
  const code = err.cause?.code ?? err.code;
  return status === 404 || code === 'index_not_found';
}

async function ensureIndexes() {
  const indexNames = ['tasks', 'notes'];
  for (const name of indexNames) {
    try {
      const index = meiliClient.index(name);
      try {
        const info = await index.fetchInfo();
        // Repair indexes that exist but were created without a primary key
        // (e.g. after a volume wipe where settings were lost).
        if (!info.primaryKey) {
          const job = await meiliClient.updateIndex(name, { primaryKey: 'id' });
          await assertTaskSucceeded(job, `updateIndex(${name})`);
        }
      } catch (err) {
        if (isIndexNotFound(err)) {
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

module.exports = { meiliClient, ensureIndexes, host };
