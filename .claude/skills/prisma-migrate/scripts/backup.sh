#!/usr/bin/env bash
# Prisma Migration Backup Script
# Usage: ./prisma/scripts/backup.sh <description>
# Example: ./prisma/scripts/backup.sh change_status_type

set -euo pipefail

DESCRIPTION="${1:?Usage: backup.sh <description>}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="prisma/backups"
BACKUP_FILE="${BACKUP_DIR}/pre_${TIMESTAMP}_${DESCRIPTION}.sql"

# Ensure DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
  # Try loading from .env
  if [ -f .env ]; then
    export $(grep -E '^DATABASE_URL=' .env | xargs)
  fi
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL is not set and not found in .env"
    exit 1
  fi
fi

# Create backups directory
mkdir -p "$BACKUP_DIR"

# Ensure .gitignore entry exists
if [ -f "$BACKUP_DIR/.gitignore" ]; then
  : # already has its own gitignore
elif ! grep -qF "prisma/backups" .gitignore 2>/dev/null; then
  echo "" >> .gitignore
  echo "# Prisma migration backups (contain real data)" >> .gitignore
  echo "prisma/backups/" >> .gitignore
  echo "Added prisma/backups/ to .gitignore"
fi

# Run pg_dump
echo "Backing up database to: $BACKUP_FILE"
pg_dump "$DATABASE_URL" --no-owner --no-privileges > "$BACKUP_FILE"

# Verify backup
BACKUP_SIZE=$(wc -c < "$BACKUP_FILE")
if [ "$BACKUP_SIZE" -lt 100 ]; then
  echo "WARNING: Backup file is suspiciously small (${BACKUP_SIZE} bytes). Verify DATABASE_URL."
  exit 1
fi

echo "Backup complete: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
echo ""
echo "To restore: psql \$DATABASE_URL < $BACKUP_FILE"
