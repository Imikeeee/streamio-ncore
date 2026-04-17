# Stage 1: Build the frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend
FROM node:22-slim AS backend-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY server/ ./
RUN npm run build

# Stage 3: Production runner
FROM node:22-slim AS runner
WORKDIR /app/server

# Set Node to production
ENV NODE_ENV=production

# Install build tools needed for better-sqlite3 compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install production dependencies for backend
COPY server/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy compiled backend and migrations
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/drizzle ./drizzle

# Copy compiled frontend
# The backend index.ts expects frontend/dist to be at ../frontend/dist relative to server/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Setup volumes directories and permissions
RUN mkdir -p /data /downloads && chown -R node:node /data /downloads /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Environment defaults
ENV PORT=3000 \
    ADDON_DIR=/data \
    DOWNLOADS_DIR=/downloads \
    APP_URL=http://localhost:3000

# Run migrations and then start the server
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
