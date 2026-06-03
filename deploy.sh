#!/bin/sh
set -e

cd /opt/liyang-photo

# Pull latest code
git checkout -- .
git pull https://ghproxy.net/https://github.com/Userwly2001/liyang-photo.git main 2>/dev/null || \
  git pull origin main 2>/dev/null || true

# Check if dependencies changed
if [ -f .last-build-deps ]; then
  DEPS_CHANGED=$(diff .last-build-deps <(cat package.json package-lock.json prisma/schema.prisma 2>/dev/null) 2>/dev/null || true)
else
  DEPS_CHANGED="yes"
fi

if [ -n "$DEPS_CHANGED" ]; then
  echo "依赖有变化，完整重建..."
  docker compose build --no-cache app
  cat package.json package-lock.json prisma/schema.prisma > .last-build-deps 2>/dev/null
else
  echo "仅代码变更，增量构建..."
  docker compose build app
fi

# Restart with new image
docker compose up -d --force-recreate app

echo "部署完成"
