#!/bin/bash
# Restore script for Eliza PostgreSQL database

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh ./backups/eliza_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Default values
POSTGRES_DB=${POSTGRES_DB:-eliza_db}
POSTGRES_USER=${POSTGRES_USER:-eliza}
CONTAINER_NAME=${CONTAINER_NAME:-eliza-postgres}

echo "Restoring database from: ${BACKUP_FILE}"

# Decompress and restore
if [[ ${BACKUP_FILE} == *.gz ]]; then
    gunzip -c ${BACKUP_FILE} | docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
else
    cat ${BACKUP_FILE} | docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
fi

echo "Restore completed successfully!"
