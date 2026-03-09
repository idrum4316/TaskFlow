# ── Stage 1: Build the Vue client ──────────────────────────────
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ─────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache tini
WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

# Copy server source
COPY server/ ./

# Copy built client into server's public directory
COPY --from=client-build /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
