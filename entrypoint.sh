#!/bin/sh
set -e

echo "初始化数据库..."
node /app/scripts/init.js

echo "启动应用..."
exec node server.js
