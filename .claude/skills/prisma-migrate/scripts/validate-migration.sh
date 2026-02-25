#!/usr/bin/env bash
# Post-Migration Validation Script
# Usage: ./validate-migration.sh [--config <prisma.config.ts>] [table_name]
# Without --config: auto-detects prisma.config.ts by searching common locations.
# Without table_name: validates all tables. With table_name: validates specific table.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUERY_SCRIPT="$SCRIPT_DIR/query.js"

# --- Parse arguments ---
PRISMA_CONFIG=""
TABLE_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)
      PRISMA_CONFIG="$2"
      shift 2
      ;;
    *)
      TABLE_NAME="$1"
      shift
      ;;
  esac
done

# --- Auto-detect prisma.config.ts if not provided ---
if [ -z "$PRISMA_CONFIG" ]; then
  CONFIG_CANDIDATES=(
    "apps/api/prisma/prisma.config.ts"
    "prisma/prisma.config.ts"
    "prisma.config.ts"
  )
  for candidate in "${CONFIG_CANDIDATES[@]}"; do
    if [ -f "$candidate" ]; then
      PRISMA_CONFIG="$candidate"
      break
    fi
  done
  if [ -z "$PRISMA_CONFIG" ]; then
    FOUND=$(find apps/*/prisma -name "prisma.config.ts" 2>/dev/null | head -1)
    if [ -n "$FOUND" ]; then
      PRISMA_CONFIG="$FOUND"
    fi
  fi
  if [ -z "$PRISMA_CONFIG" ]; then
    echo "ERROR: Could not find prisma.config.ts. Use --config <path> to specify."
    exit 1
  fi
fi

echo "Using config: $PRISMA_CONFIG"

# --- Derive schema path from config directory ---
CONFIG_DIR=$(dirname "$PRISMA_CONFIG")
SCHEMA_PATH="$CONFIG_DIR/schema.prisma"

# --- Ensure DATABASE_URL is set ---
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f .env ]; then
    export $(grep -E '^DATABASE_URL=' .env | xargs)
  fi
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL is not set and not found in .env"
    exit 1
  fi
fi

# --- Query helper: uses query.js (works everywhere), falls back to psql ---
run_sql() {
  local sql="$1"
  if [ -f "$QUERY_SCRIPT" ]; then
    # query.js outputs console.table format; extract raw values
    node "$QUERY_SCRIPT" "$sql" 2>/dev/null | grep "│" | grep -v "index" | grep -v "─" | sed 's/│//g' | awk '{$1=$1};1' || echo ""
  elif command -v psql &>/dev/null; then
    psql "$DATABASE_URL" -t -A -c "$sql" 2>/dev/null
  else
    echo "ERROR: Neither query.js nor psql available"
    return 1
  fi
}

# Simple count query — returns just the number
run_count() {
  local sql="$1"
  if [ -f "$QUERY_SCRIPT" ]; then
    node "$QUERY_SCRIPT" "$sql" 2>/dev/null | grep "│" | grep -v "index" | grep -v "─" | head -1 | sed 's/│//g' | awk '{$1=$1; print $NF}' || echo "0"
  elif command -v psql &>/dev/null; then
    psql "$DATABASE_URL" -t -A -c "$sql" 2>/dev/null
  else
    echo "0"
  fi
}

# List query — returns one value per line
run_list() {
  local sql="$1"
  if command -v psql &>/dev/null; then
    psql "$DATABASE_URL" -t -A -c "$sql" 2>/dev/null
  elif [ -f "$QUERY_SCRIPT" ]; then
    node "$QUERY_SCRIPT" "$sql" 2>/dev/null | grep "│" | grep -v "index" | grep -v "─" | sed 's/│//g' | awk '{$1=$1; print $NF}'
  else
    echo ""
  fi
}

echo "=== Post-Migration Validation ==="
echo ""

# 1. Check migration status
echo "--- Migration Status ---"
npx prisma migrate status --config "$PRISMA_CONFIG" 2>&1 || true
echo ""

# 2. Row counts
echo "--- Row Counts ---"
if [ -n "$TABLE_NAME" ]; then
  COUNT=$(run_count "SELECT COUNT(*) FROM \"$TABLE_NAME\";")
  echo "  $TABLE_NAME: $COUNT rows"
else
  TABLES=$(run_list "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations';")
  for TABLE in $TABLES; do
    COUNT=$(run_count "SELECT COUNT(*) FROM \"$TABLE\";")
    echo "  $TABLE: $COUNT rows"
  done
fi
echo ""

# 3. NULL checks (columns that are NOT NULL)
echo "--- NULL Constraint Check ---"
if [ -n "$TABLE_NAME" ]; then
  NULLABLE_COLS=$(run_list "SELECT column_name FROM information_schema.columns WHERE table_name = '$TABLE_NAME' AND table_schema = 'public' AND is_nullable = 'YES';")
  for COL in $NULLABLE_COLS; do
    NULL_COUNT=$(run_count "SELECT COUNT(*) FROM \"$TABLE_NAME\" WHERE \"$COL\" IS NULL;")
    if [ "$NULL_COUNT" -gt 0 ] 2>/dev/null; then
      echo "  $TABLE_NAME.$COL: $NULL_COUNT NULLs"
    fi
  done
else
  echo "  (specify table name for NULL checks)"
fi
echo ""

# 4. Check for failed migrations
echo "--- Failed Migrations ---"
FAILED=$(run_list "SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NOT NULL OR finished_at IS NULL;" 2>/dev/null || echo "")
if [ -n "$FAILED" ]; then
  echo "  WARNING: Failed/incomplete migrations found:"
  echo "$FAILED" | while read -r m; do echo "    - $m"; done
else
  echo "  None"
fi
echo ""

# 5. Schema drift check (compare schema.prisma vs DB)
echo "--- Schema Drift Check ---"
DRIFT=$(npx prisma migrate diff --from-config-datasource --to-schema "$SCHEMA_PATH" --config "$PRISMA_CONFIG" --exit-code 2>&1) && DRIFT_CODE=$? || DRIFT_CODE=$?
if [ "$DRIFT_CODE" -eq 0 ]; then
  echo "  No drift detected"
elif [ "$DRIFT_CODE" -eq 2 ]; then
  echo "  WARNING: Schema drift detected!"
  echo "$DRIFT"
else
  echo "  Could not check drift (error code: $DRIFT_CODE)"
fi
echo ""

# 6. Type check
echo "--- TypeScript Check ---"
npx tsc --noEmit 2>&1 | tail -5 || true
echo ""

echo "=== Validation Complete ==="
