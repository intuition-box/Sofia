#!/bin/bash
# Backup script for Eliza PostgreSQL database

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/eliza_backup_${TIMESTAMP}.sql"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Default values
POSTGRES_DB=${POSTGRES_DB:-eliza_db}
POSTGRES_USER=${POSTGRES_USER:-eliza}
CONTAINER_NAME=${CONTAINER_NAME:-eliza-postgres}

echo "Starting backup of database: ${POSTGRES_DB}"

# Create backup
docker exec -t ${CONTAINER_NAME} pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}

echo "Backup completed: ${BACKUP_FILE}.gz"

# Optional: Keep only last 7 days of backups
find ${BACKUP_DIR} -name "eliza_backup_*.sql.gz" -mtime +7 -delete

echo "Old backups cleaned up (kept last 7 days)"
