#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies (needed for Prisma CLI)
npm install

# Run Prisma client generation using the correct CLI version
npx prisma@5.17.0 generate

# Apply database migrations
npx prisma migrate deploy

echo "Build finished successfully!"