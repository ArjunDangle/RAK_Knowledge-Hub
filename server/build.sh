#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
# Use --no-cache-dir to ensure fresh installs in build environment if needed
pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies (needed for Prisma CLI)
npm install

# Run Prisma client generation using the correct CLI version
npx prisma@5.17.0 generate

# Fetch the required Prisma binary engines for the Python client
prisma py fetch

# Apply database migrations
npx prisma migrate deploy

echo "Build finished successfully!"