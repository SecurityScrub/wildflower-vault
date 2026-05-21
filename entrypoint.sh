#!/bin/sh
chown -R nextjs:nodejs /app/uploads 2>/dev/null || true
exec su-exec nextjs node server.js
