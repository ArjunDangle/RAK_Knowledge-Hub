#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies (needed for Prisma CLI)
npm install

# Generate the Prisma Client Python code
npx prisma@5.17.0 generate

# Manually fetch the required binary and place it next to the schema.
# Prisma Client Python will automatically look for it here.
npx prisma@5.17.0 fetch --binary-target="debian-openssl-3.0.x"

# Apply database migrations
npx prisma@5.17.0 migrate deploy

echo "Build finished successfully!"