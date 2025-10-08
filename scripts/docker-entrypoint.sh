#!/bin/sh
set -e

echo "🚀 Starting Tastebase..."
echo "📦 Migrations will run automatically on first database connection..."

# Start the application (migrations run automatically via src/db/index.ts)
exec node server.js
