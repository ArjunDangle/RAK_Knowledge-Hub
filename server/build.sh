#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies. This will automatically trigger
# the "postinstall" script in package.json, which runs 'prisma py fetch'.
npm install

# Apply database migrations
npx prisma migrate deploy

echo "Build finished successfully!"