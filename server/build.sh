#!/usr/bin/env bash
set -o errexit

echo "--- Starting build process ---"

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

# Node.js check is no longer strictly necessary but doesn't hurt
echo "--- Checking Node.js version ---"
node -v
npm -v

# --- Use Python to generate, ensuring correct engine placement ---
echo "--- Generating Prisma Client (using Python wrapper) ---"
python -m prisma generate

echo "--- Applying database migrations (using Python wrapper) ---"
python -m prisma migrate deploy

echo "--- Build finished ---"

