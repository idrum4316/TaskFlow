# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

TaskFlow is a multi-user task/board tracking application with a Vue 3 single-page client and an Express API server.

- `client/` — Vue 3 + Vite SPA using Pinia, Vue Router, Tailwind CSS, Axios, and `vite-plugin-pwa`.
  - `src/views/` contains route-level pages.
  - `src/components/` contains reusable UI pieces.
  - `src/stores/` contains Pinia stores for API-backed state.
  - `src/api/client.js` defines the shared Axios client and auth/session-expiry handling.
  - `vite.config.js` proxies `/api` and `/ws` to the local server on port `3000` during development.
- `server/` — Node/Express API using CommonJS modules.
  - `index.js` wires middleware, routes, CouchDB initialization, S3/MinIO bucket setup, migrations, and WebSocket change notifications.
  - `routes/` contains REST endpoints grouped by resource.
  - `config/couch.js` defines CouchDB databases and design docs.
  - `migrations/` contains ordered CouchDB data migrations registered in `migrations/runner.js`.
  - `config/s3.js` handles S3-compatible attachment storage.
- Production builds serve the Vite output from `server/public` inside the Docker image.

## Development commands

Use npm; both `client/package-lock.json` and `server/package-lock.json` are committed.

From the repository root:

```sh
npm run install:all      # install server and client dependencies
npm run dev:server      # run Express via nodemon from server/
npm run dev:client      # run Vite dev server from client/ on port 5173
npm run dev             # start server and client concurrently via shell backgrounding
npm run build           # build the Vue client only
```

Component-specific commands:

```sh
npm run start --prefix server    # run server/index.js
npm run dev --prefix server      # run nodemon server/index.js
npm run dev --prefix client      # run Vite dev server
npm run build --prefix client    # build client/dist
npm run preview --prefix client  # preview built client
node client/scripts/generate-icons.js  # regenerate PWA PNG icons from SVG sources
```

Docker deployment is defined by `Dockerfile` and `docker-compose.yml`:

```sh
docker compose up --build
```

The compose stack includes CouchDB, MinIO, and the app. It requires environment values such as `COUCHDB_PASSWORD` and `JWT_SECRET` (typically provided through a root `.env`).

## Testing and linting

No test, lint, or formatting scripts are currently configured in the root, client, or server package files. Do not claim tests pass unless you add/run an actual command. For validation, at minimum run the relevant build command after client changes when practical.

## Code conventions

- Client code uses ES modules, Vue single-file components, Pinia stores, and the `@` alias for `client/src`.
- Server code uses CommonJS (`require`/`module.exports`) and Express routers.
- Existing JavaScript style is single quotes with semicolons; follow nearby file style.
- Keep API calls centralized through `client/src/api/client.js` and Pinia stores where possible.
- Preserve auth behavior: client stores the JWT in `localStorage`, Axios sends `Authorization: Bearer <token>`, and non-auth `401` responses set `sessionExpired`.
- When adding CouchDB schema/view changes, update `server/config/couch.js`; when data needs to be transformed, add a new numbered migration and register it in `server/migrations/runner.js`.
- During local development the client should call relative `/api` and `/ws` paths so Vite can proxy them.

## Generated, dependency, and environment files

Do not manually edit generated or installed artifacts unless explicitly requested:

- `node_modules/`, `server/node_modules/`, `client/node_modules/`
- `client/dist/` (Vite build output)
- `server/public/` when present from production image/build output
- PWA PNG icons in `client/public/pwa-*.png` should be regenerated from `client/public/icon-svg.svg` and `client/public/icon-maskable-svg.svg` using `node client/scripts/generate-icons.js`.

Environment and secrets notes:

- `server/.env` and root `.env` are ignored; use `server/.env.example` as the template for local server settings.
- Do not commit real secrets. `JWT_SECRET`, CouchDB credentials, and MinIO/S3 credentials must be treated as sensitive.
- `.env.production` exists in the repository; review carefully before changing and avoid adding secrets.

## Workflow constraints for agents

- Read the relevant files before editing and prefer targeted changes over broad rewrites.
- Keep changes scoped to the requested feature/fix and avoid reformatting unrelated files.
- Update lockfiles only when dependencies are intentionally changed.
- If adding new package scripts, document them here and ensure they work from the stated directory.
