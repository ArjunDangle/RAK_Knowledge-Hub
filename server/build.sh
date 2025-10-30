#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# 2. Install Node.js dependencies
# This will trigger the "postinstall" script in package.json,
# which runs "prisma py fetch && prisma generate"
npm install

# 3. Run database migrations
# This command will work because the binaries are now
# in the node_modules directory
npx prisma generate



echo "✅ Build finished successfully!"