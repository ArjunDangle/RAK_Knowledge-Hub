    #!/usr/bin/env bash

    # Exit immediately if a command exits with a non-zero status.
    set -o errexit

    echo "--- Starting build process ---"

    # Install Python dependencies
    echo "--- Installing Python dependencies ---"
    pip install -r requirements.txt

    # --- Node.js Dependency Section ---
    # Render needs Node.js installed for the 'npx' commands below.
    # Ensure your Render environment provides Node.js (e.g., via Buildpacks).
    echo "--- Checking Node.js version (requires Node.js to be installed) ---"
    node -v
    npm -v

    # Generate Prisma Client (uses npx, requires Node.js)
    echo "--- Generating Prisma Client ---"
    npx prisma generate

    # Apply database migrations (uses npx, requires Node.js)
    echo "--- Applying database migrations ---"
    npx prisma migrate deploy

    echo "--- Build finished ---"
    
