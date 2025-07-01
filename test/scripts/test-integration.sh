#!/bin/bash

# Start docker compose in detached mode
docker compose up -d

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
RETRIES=30
until docker compose  exec -T mysql2 mysqladmin ping -h"127.0.0.1" --silent; do
  RETRIES=$((RETRIES-1))
  if [ $RETRIES -le 0 ]; then
    echo "MySQL did not become ready in time."
    docker compose logs
    exit 1
  fi
  sleep 2
done

echo "MySQL is ready. Running integration tests..."

npm run test:int

EXIT_CODE=$?

# Tear down docker compose
docker compose  down -v

exit $EXIT_CODE
