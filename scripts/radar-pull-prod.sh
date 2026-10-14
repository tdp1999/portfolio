#!/usr/bin/env bash
# Clone the Radar tables (radar_*) from production into the local Postgres.
#
# - Production is only read: a data-only pg_dump of the radar_* tables.
# - Local: every radar_* table is truncated, then refilled. Nothing else in the local DB is touched.
# - The production URL comes from the linked Railway CLI (Postgres service, DATABASE_PUBLIC_URL)
#   and never reaches the terminal. Override with PROD_DATABASE_URL if the CLI is not linked.
# - Prod runs Postgres 17, local runs 16: the dump uses a postgres:17 client and drops the one
#   PG17-only setting (transaction_timeout) that 16 rejects.
#
# Usage: bash scripts/radar-pull-prod.sh
set -euo pipefail

LOCAL_CONTAINER="${LOCAL_CONTAINER:-portfolio-db}"
LOCAL_DB="${LOCAL_DB:-portfolio}"
LOCAL_USER="${LOCAL_USER:-postgres}"
PG_CLIENT_IMAGE="${PG_CLIENT_IMAGE:-postgres:17-alpine}"

export PROD_URL="${PROD_DATABASE_URL:-$(railway variables --service Postgres --environment production --json | jq -r '.DATABASE_PUBLIC_URL // empty')}"
if [[ -z "$PROD_URL" ]]; then
  echo "No production URL: link the Railway CLI (railway link) or set PROD_DATABASE_URL." >&2
  exit 1
fi

local_psql() {
  docker exec -i "$LOCAL_CONTAINER" psql -U "$LOCAL_USER" -d "$LOCAL_DB" -v ON_ERROR_STOP=1 "$@"
}
prod_psql() {
  docker run --rm -i -e PROD_URL "$PG_CLIENT_IMAGE" sh -c 'psql "$PROD_URL" -At "$@"' sh "$@"
}

echo "→ Checking that local migrations match production"
migrations_sql="SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY 1"
prod_migrations="$(prod_psql -c "$migrations_sql")"
local_migrations="$(local_psql -At -c "$migrations_sql")"
if [[ "$prod_migrations" != "$local_migrations" ]]; then
  echo "Local and production migrations differ. Apply the missing migrations first:" >&2
  diff <(echo "$prod_migrations") <(echo "$local_migrations") >&2 || true
  exit 1
fi

DUMP="$(mktemp -t radar-prod-dump)"
trap 'rm -f "$DUMP"' EXIT

echo "→ Dumping radar_* data from production (read-only)"
docker run --rm -e PROD_URL "$PG_CLIENT_IMAGE" \
  sh -c 'pg_dump "$PROD_URL" --data-only --no-owner --no-privileges --table="public.radar_*"' |
  grep -v '^SET transaction_timeout' >"$DUMP"

echo "→ Replacing local radar_* data"
{
  echo "BEGIN;"
  # Replica mode skips FK triggers while rows load in dump order.
  echo "SET session_replication_role = replica;"
  echo "DO \$\$ DECLARE t text; BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'radar\_%' LOOP
      EXECUTE format('TRUNCATE TABLE public.%I CASCADE', t);
    END LOOP;
  END \$\$;"
  # The dump resets search_path to empty; keep table refs schema-qualified (pg_dump already does).
  cat "$DUMP"
  echo "SET session_replication_role = origin;"
  echo "COMMIT;"
} | local_psql -q >/dev/null

echo "→ Row counts (local)"
local_psql -c "
  SELECT 'radar_sources' AS table, count(*) FROM public.radar_sources
  UNION ALL SELECT 'radar_runs', count(*) FROM public.radar_runs
  UNION ALL SELECT 'radar_items', count(*) FROM public.radar_items
  UNION ALL SELECT 'radar_enrichments', count(*) FROM public.radar_enrichments
  UNION ALL SELECT 'radar_briefs', count(*) FROM public.radar_briefs
  UNION ALL SELECT 'radar_item_notes', count(*) FROM public.radar_item_notes"
echo "Done."
