#!/bin/sh
set -e

# Wait for database to be available
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    sleep 1
  done
  echo "Database is up!"
fi

# Run Drizzle migrations
echo "Running Drizzle migrations..."
npx drizzle-kit migrate
echo "Migrations completed!"

echo "Starting D&D Spells app..."
exec "$@"
