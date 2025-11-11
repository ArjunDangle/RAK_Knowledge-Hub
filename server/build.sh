#!/usr/bin/env bash
# Exit on error
set -o errexit

# Step 1: Install all Python and Node.js dependencies. This is required for both scenarios.
echo "Installing Python and Node.js dependencies..."
pip install --no-cache-dir -r requirements.txt
npm install # This will also trigger "prisma generate" via the postinstall script in package.json

# Step 2: Check for the one-time reset flag.
if [[ "$RUN_DB_RESET_ONCE" == "true" ]]; then
  # --- DANGEROUS ONE-TIME PATH ---
  # This block will only run when the environment variable is set.
  echo "--- ONE-TIME DATABASE RESET & IMPORT INITIATED ---"
  
  # Completely wipe the database and apply all migrations from scratch.
  # The --force flag is essential for non-interactive environments like Render.
  echo "Resetting the database..."
  npx prisma migrate reset --force
  
  # Re-import all data from your Confluence source.
  echo "Importing all data from Confluence..."
  python one_time_import.py
  
  echo "--- ONE-TIME PROCESS COMPLETE. REMEMBER TO UNSET THE ENV VARIABLE. ---"
else
  # --- STANDARD DEPLOYMENT PATH ---
  # This is the normal process for all subsequent deployments.
  echo "--- STANDARD DEPLOYMENT ---"
  
  # Safely apply any new database migrations without deleting data.
  echo "Applying database migrations..."
  npx prisma migrate deploy
  
  echo "--- STANDARD DEPLOYMENT COMPLETE ---"
fi

echo "✅ Build finished successfully!"