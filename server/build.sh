#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies, which makes the `prisma` CLI available
npm install

# Generate the Prisma Client Python code using the standard JS CLI.
# This reads the schema and creates the necessary Python files.
npx prisma generate

# Apply database migrations to the database using the standard JS CLI.
npx prisma migrate deploy

echo "Build finished successfully!"