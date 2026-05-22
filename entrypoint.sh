#!/bin/sh
set -e

chown -R nextjs:nodejs /app/uploads 2>/dev/null || true

# Apply schema changes to the database on every deploy.
# Using `db push` (not `migrate deploy`) because the project tracks schema-only,
# not migration history. `--skip-generate` because the client was already
# generated during the Docker build.
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma schema to database..."
  npx prisma db push --skip-generate --accept-data-loss || {
    echo "[entrypoint] WARNING: prisma db push failed. Continuing startup so the app can still serve; investigate the schema drift."
  }
else
  echo "[entrypoint] DATABASE_URL not set — skipping schema sync."
fi

exec su-exec nextjs node server.js
