#!/usr/bin/env bash
set -o errexit

# 1. Tell Prisma to put binaries in a local 'binaries' folder
export PRISMA_PY_BINARIES_DIR=binaries

# 2. Install Python & Node deps
pip install --no-cache-dir -r requirements.txt
npm install

# 3. Run Prisma commands
# (The 'postinstall' hook in package.json will also run these,
#  but being explicit here is safer and ensures order)
prisma generate

# 4. Fetch binaries INTO the 'server/binaries' folder
prisma py fetch

# 5. Run migrations (it will find the binaries in './binaries')
npx prisma migrate deploy

echo "✅ Build finished. Binaries are in ./binaries"