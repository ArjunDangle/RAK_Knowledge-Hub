#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# 2. Install Node.js dependencies
# This will trigger the "postinstall" script in package.json,
# which runs "prisma py fetch && prisma generate"
npm install

# 3. Apply database migrations
npx prisma migrate deploy

# 4. Explicitly generate the Prisma client
# This ensures the client is available to the running application.
npx prisma generate


echo "✅ Build finished successfully!"