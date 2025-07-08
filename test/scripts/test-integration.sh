#!/bin/bash

# Start docker compose in detached mode
docker compose up -d

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
RETRIES=30
until docker compose exec -T mysql mysqladmin ping -h"127.0.0.1" --silent; do
  RETRIES=$((RETRIES-1))
  if [ $RETRIES -le 0 ]; then
    echo "MySQL did not become ready in time."
    echo "Checking MySQL logs:"
    docker compose logs mysql
    echo "Checking certificate files:"
    docker compose exec -T mysql ls -la /etc/mysql/certs/ || echo "Could not access certs directory"
    exit 1
  fi
  sleep 2
done

echo "MySQL is ready. Running integration tests..."

# Verify SSL is enabled
echo "Verifying SSL configuration..."
docker compose exec -T mysql mysql -u example_user -pexample_password -e "SHOW VARIABLES LIKE 'have_ssl';" example_db

npm run test:int

EXIT_CODE=$?

# Tear down docker compose
docker compose down -v

exit $EXIT_CODE
