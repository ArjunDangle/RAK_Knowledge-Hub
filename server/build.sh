#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies.
# The `prisma py` command below will use this environment to install
# its own compatible version of the Prisma CLI.
npm install

# Generate the Prisma Client Python code using the Python wrapper.
# This ensures the correct, compatible version of the Prisma CLI is used.
prisma py generate

# Apply database migrations using the Python wrapper.
prisma py migrate deploy

echo "Build finished successfully!"