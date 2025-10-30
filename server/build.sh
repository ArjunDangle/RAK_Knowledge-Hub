#!/usr/bin/env bash
set -o errexit

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
npm install

# Generate Prisma Python client
prisma generate

# Fetch the Prisma engine binaries for this OS
prisma py fetch

# Apply database migrations
npx prisma migrate deploy

echo "✅ Build finished successfully!"