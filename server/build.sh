    #!/usr/bin/env bash
    set -o errexit

    echo "--- Starting build process ---"

    echo "--- Installing Python dependencies ---"
    pip install -r requirements.txt

    echo "--- Checking Node.js version ---"
    node -v
    npm -v

    # Specify the Prisma CLI version required by the Python client
    PRISMA_CLI_VERSION="5.17.0"
    echo "--- Using Prisma CLI version $PRISMA_CLI_VERSION ---"

    echo "--- Generating Prisma Client ---"
    npx prisma@$PRISMA_CLI_VERSION generate

    echo "--- Applying database migrations ---"
    npx prisma@$PRISMA_CLI_VERSION migrate deploy

    echo "--- Build finished ---"