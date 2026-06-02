#!/bin/sh
set -e

echo "Starting application..."

# Attempt DB migration in background (don't block startup)
# If it fails, the admin can run it manually via docker exec
npx prisma db push --accept-data-loss --skip-generate 2>/dev/null &
sleep 2

# Attempt admin seed in background
npx tsx scripts/seed.ts 2>/dev/null &
sleep 1

echo "Ready."
exec node server.js
