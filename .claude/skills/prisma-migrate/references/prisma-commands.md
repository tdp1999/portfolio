# Prisma CLI Commands Reference

## Config Flag (Prisma v7+)

**All commands** that need to locate the schema use `--config` (not `--schema`):

```bash
npx prisma <command> --config $PRISMA_CONFIG
```

`$PRISMA_CONFIG` is the path to `prisma.config.ts`, resolved once per session by the skill workflow (see skill.md "Resolve PRISMA_CONFIG").

The config file defines `schema`, `migrations`, and `datasource.url`.
**`--schema` is removed in v7.** Always use `--config` when schema is not in the default location.

---

## migrate dev (Development Only)

Creates and applies migrations using a shadow database.

```bash
npx prisma migrate dev [options] --config $PRISMA_CONFIG
```

| Flag | Description |
|---|---|
| `--name` / `-n` | Name for the migration |
| `--create-only` | Generate SQL file without applying. **Always use this for review.** |
| `--config` | Path to `prisma.config.ts` (required when not in default location) |

**Behavior:**
- Replays migration history in shadow DB to detect drift
- Applies pending migrations
- Generates new migration from schema changes
- Updates `_prisma_migrations` table
- **Prisma v7:** No longer auto-runs `prisma generate` or seed scripts

---

## migrate deploy (Production/CI)

Applies pending migrations. No shadow database needed.

```bash
npx prisma migrate deploy [options] --config $PRISMA_CONFIG
```

| Flag | Description |
|---|---|
| `--config` | Path to `prisma.config.ts` |

**Behavior:**
- Applies all pending migrations only
- Does NOT detect drift, reset, generate, or use shadow DB
- Creates database if it doesn't exist
- Uses advisory locking to prevent concurrent runs
- Does NOT run `prisma generate` — do that separately before build

---

## migrate reset (Development Only — DESTRUCTIVE)

Drops and recreates database, re-applies all migrations.

```bash
npx prisma migrate reset [options] --config $PRISMA_CONFIG
```

| Flag | Description |
|---|---|
| `--force` | Skip confirmation. **Blocked for AI agents** unless `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var is set |
| `--skip-generate` | Skip running generators |
| `--skip-seed` | Skip running seed script |

**NEVER use in production.**

---

## migrate resolve (Production Troubleshooting)

Marks a migration as applied or rolled back in `_prisma_migrations` without executing SQL.

```bash
npx prisma migrate resolve [options] --config $PRISMA_CONFIG
```

| Flag | Description |
|---|---|
| `--applied "<name>"` | Mark migration as successfully applied (e.g., after manual hotfix) |
| `--rolled-back "<name>"` | Mark failed migration as rolled back (allows retry on next deploy) |

**Rolled-back workflow:**
1. Migration fails mid-execution in production
2. `npx prisma migrate resolve --rolled-back "20260225_migration_name" --config $PRISMA_CONFIG`
3. Fix the migration SQL
4. `npx prisma migrate deploy --config $PRISMA_CONFIG` to retry

**Applied workflow:**
1. Hotfix applied directly to production DB
2. Generate matching migration locally
3. `npx prisma migrate resolve --applied "20260225_migration_name" --config $PRISMA_CONFIG` on patched DB

---

## migrate status

Reports migration state by comparing `./prisma/migrations/*` against `_prisma_migrations` table.

```bash
npx prisma migrate status --config $PRISMA_CONFIG
```

**Exit codes (v4.3.0+):** Returns `1` for: connection errors, unapplied migrations, diverged history, missing migration table, failed migrations.

---

## migrate diff

Compares two schema sources. Outputs human-readable summary or executable SQL.

```bash
npx prisma migrate diff [options] --config $PRISMA_CONFIG
```

**From source (one required):** `--from-empty`, `--from-schema <path>`, `--from-migrations <path>`, `--from-config-datasource`

**To source (one required):** `--to-empty`, `--to-schema <path>`, `--to-migrations <path>`, `--to-config-datasource`

**Output:** `--script` (SQL), `-o <file>`, `--exit-code` (0=empty, 2=non-empty, 1=error)

---

## db execute

Run raw SQL against the database.

```bash
echo 'SELECT COUNT(*) FROM users;' | npx prisma db execute --stdin --config $PRISMA_CONFIG
```

Or from file:
```bash
npx prisma db execute --file path/to/script.sql --config $PRISMA_CONFIG
```

**Note:** `--schema` flag is removed in v7. Use `--config` only.

---

## generate

Regenerates Prisma Client from schema.

```bash
npx prisma generate --config $PRISMA_CONFIG
```

**Must run before `nx build`** so generated types are available at compile time.

---

## studio

Visual database browser.

```bash
npx prisma studio --config $PRISMA_CONFIG
```

Opens browser UI for inspecting/editing data. Development only.

---

## NestJS Build Order

```bash
npx prisma generate --config $PRISMA_CONFIG   # 1. Generate types
pnpm nx build api                               # 2. Compile (needs generated types)
npx prisma migrate deploy --config $PRISMA_CONFIG  # 3. Apply migrations (CI/prod)
node dist/apps/api/main.js                      # 4. Start
```

---

## Shadow Database

Temporary DB created/deleted automatically by `migrate dev`. Used to:
- Replay entire migration history
- Detect schema drift (manual DB changes)
- Evaluate new migrations for data loss

**PostgreSQL requires:** superuser or `CREATEDB` privilege.

Never used in production. Configure `shadowDatabaseUrl` in `prisma.config.ts` (v7+) for cloud-hosted DBs that restrict CREATE/DROP.
