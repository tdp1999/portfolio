---
name: prisma-migrate
description: |
  Prisma migration workflow with safety analysis. Detects destructive schema changes,
  backs up data, asks user for transformation logic, and generates expand/migrate/contract
  migration sets. Ensures zero data loss through multi-step migration patterns.
  Triggers: "migrate", "prisma migrate", "schema change", "migration", "/prisma-migrate"
---

# Prisma Migration Workflow

Safe, zero-data-loss migration workflow for Prisma schema changes.

## Resolve PRISMA_CONFIG (do this FIRST)

Before running any Prisma command, resolve the config path **once** for the session:

1. If user referenced a schema file (e.g. `@apps/api/prisma/schema.prisma`), look for `prisma.config.ts` in the same directory.
2. Otherwise, auto-detect by searching these locations in order:
   - `apps/*/prisma/prisma.config.ts`
   - `prisma/prisma.config.ts`
   - `prisma.config.ts` (root)
3. If multiple configs exist (e.g. multi-app monorepo), ask the user which app to target.
4. Store the resolved path as `PRISMA_CONFIG` and use `--config $PRISMA_CONFIG` on **every** `npx prisma` command.

```bash
# Example: resolve and verify
PRISMA_CONFIG="apps/api/prisma/prisma.config.ts"  # resolved from context
npx prisma migrate status --config "$PRISMA_CONFIG"
```

**All `npx prisma` commands below assume `--config $PRISMA_CONFIG` is appended.** Shown as `--config $PRISMA_CONFIG` for clarity.

## References & Scripts

| File | Purpose |
|---|---|
| `references/prisma-commands.md` | All Prisma CLI commands, flags, v7 changes, NestJS build order |
| `references/destructive-patterns.md` | SQL patterns to detect in generated migrations with risk levels |
| `references/expand-contract-templates.md` | 11 ready-made SQL templates for every destructive scenario |
| `scripts/query.js` | Node-based SQL query runner using @prisma/client (works without psql) |
| `scripts/backup.sh` | Automated pg_dump with timestamp naming, .gitignore setup, size verification |
| `scripts/validate-migration.sh` | Post-migration validation: row counts, NULL checks, drift detection, tsc check |

### Script Usage

```bash
# Backup before destructive migration
bash .claude/skills/prisma-migrate/scripts/backup.sh <description>

# Validate after migration (auto-detects config, or pass --config)
bash .claude/skills/prisma-migrate/scripts/validate-migration.sh [--config $PRISMA_CONFIG] [table_name]
```

## Philosophy

- Migrations are **forward-only** (no Down migrations)
- Destructive changes are split into **Expand → Data Migration → Contract** steps
- User provides **transformation logic** for business-critical data decisions
- Always **backup before destructive changes**

## Risk Classification

### Safe Changes (auto-proceed after review)

| Change | Why Safe |
|---|---|
| Add column (nullable) | No impact on existing rows |
| Add column (NOT NULL + default) | Backfills automatically |
| Remove NOT NULL (make nullable) | Relaxes constraint |
| Remove unique constraint | Relaxes constraint |
| Change default value | Only affects future rows |
| Create table | New structure |
| Add index | Performance only |
| Remove index | Performance only |
| Add optional relation | No constraint on existing rows |
| Create enum | New type |
| Add enum value | Extends options |
| Add `onDelete` action | Runtime behavior change only |

### Destructive Changes (require backup + multi-step)

| Change | Risk | Default Strategy |
|---|---|---|
| Remove column | Data loss | Backup → confirm intent → drop |
| Rename column | Data loss (Prisma does DROP+ADD) | Expand → copy → contract |
| Change type (incompatible) | Data loss/failure | **Ask user for transform logic** |
| Change type (narrowing) | Data truncation | **Ask user for transform logic** |
| Add NOT NULL to nullable | Fails if NULLs exist | **Ask user for default value** |
| Add unique constraint | Fails if duplicates exist | **Ask user for dedup strategy** |
| Remove enum value | Fails if rows use it | **Ask user for replacement value** |
| Rename enum value | Data loss (DROP+CREATE) | Expand → migrate → contract |
| Add required FK | Fails if no FK value | **Ask user for backfill strategy** |
| Drop table | Data loss | Backup → confirm intent → drop |
| Rename table | Data loss (DROP+CREATE) | Expand → copy → contract |
| Add NOT NULL column without default | Fails if rows exist | **Ask user for default value** |
| Change relation cardinality | FK restructure | **Ask user for mapping logic** |

## Complete Workflow

### Step 0: Review Current Data State

Before editing schema, check existing data if modifying tables:

```bash
# Query using the portable Node helper (works in dev, CI, prod — no psql needed)
QUERY="node .claude/skills/prisma-migrate/scripts/query.js"
$QUERY 'SELECT COUNT(*) as total FROM "table_name"'
$QUERY 'SELECT COUNT("col") as non_null, COUNT(*) - COUNT("col") as nulls FROM "table_name"'
```

Report to user: "Table X has N rows. Column Y has M NULL values."

### Step 1: Edit schema.prisma

Make the schema changes based on task requirements.

### Step 2: Generate SQL (Dry Run)

**`prisma migrate dev` requires an interactive TTY and cannot run from Claude Code.**
Ask the user to run this command in their terminal:

> Please run: `npx prisma migrate dev --create-only --name descriptive_name --config $PRISMA_CONFIG`

Then read the generated `migration.sql` to analyze it. **Never skip this step.**

### Step 3: Analyze SQL for Risk

Review the generated SQL and classify every statement:

- Look for `DROP COLUMN`, `DROP TABLE` → data loss
- Look for `ALTER COLUMN ... TYPE` → type change
- Look for `NOT NULL` without `DEFAULT` → constraint failure
- Look for `ADD UNIQUE` → duplicate failure
- Compare against the Risk Classification table above

### Step 4: Branch Based on Risk

**If ALL changes are safe:**

1. Show user the SQL for review
2. Proceed to Step 6

**If ANY change is destructive:**

1. Run backup (Step 5)
2. Delete the auto-generated migration
3. Split into multi-step migrations (Step 5)

### Step 5: Handle Destructive Changes

#### 5a: Backup

```bash
# Timestamp format: YYYYMMDD_description
pg_dump $DATABASE_URL > prisma/backups/pre_YYYYMMDD_description.sql
```

Ensure `prisma/backups/` is in `.gitignore`.

#### 5b: Ask User for Transformation Logic

For each destructive change, ask the user specifically:

**Change type (incompatible):**
> "Column `{col}` is changing from `{old_type}` to `{new_type}`. There are N rows with data.
> How should existing values be transformed? Example: `if text exists → 1, else → 0`"

**Add NOT NULL to nullable:**
> "Column `{col}` is becoming NOT NULL. There are N rows with NULL values.
> What default value should fill these NULLs?"

**Add unique constraint:**
> "Column `{col}` is getting a UNIQUE constraint. There are N duplicate values.
> How should duplicates be resolved? (keep first, merge, delete?)"

**Remove enum value:**
> "Enum value `{value}` is being removed. N rows currently use it.
> What value should replace it?"

**Add required FK:**
> "Column `{col}` is a new required foreign key. Existing rows have no value.
> How should existing rows be linked? (default record ID, delete orphans?)"

**Change relation cardinality:**
> "Relation `{relation}` is changing from {old} to {new}.
> How should existing data be mapped?"

#### 5c: Generate Multi-Step Migrations

Use the **Expand → Data Migration → Contract** pattern.
For each step, edit the schema to the intermediate state and ask the user to run:

> Please run: `npx prisma migrate dev --create-only --name YYYYMMDD_description_expand --config $PRISMA_CONFIG`

Then read and review the generated SQL. Manually edit if needed (e.g., add data migration SQL).
Repeat for `_data` and `_contract` steps.

Each SQL file must be reviewed by the user before execution.

### Step 6: Apply Migration

Ask the user to run in their terminal:

> Please run: `npx prisma migrate dev --config $PRISMA_CONFIG`

### Step 7: Regenerate Client

```bash
npx prisma generate --config $PRISMA_CONFIG
```

### Step 8: Validate

After execution, verify:

- Row counts match expectations
- Transformed data is correct (spot-check)
- No orphaned records
- Application still builds: `npx tsc --noEmit`

### Step 9: Run Affected Tests

```bash
pnpm nx affected --target=test
```

## Migration Folder Structure

```
prisma/
  schema.prisma
  migrations/
    20260225120000_add_user_table/          ← safe, single migration
      migration.sql
    20260226100000_change_status_expand/    ← destructive step 1
      migration.sql
    20260226100001_change_status_data/      ← destructive step 2 (user logic)
      migration.sql
    20260226100002_change_status_contract/  ← destructive step 3
      migration.sql
  backups/                                  ← .gitignored
    pre_20260226_change_status.sql
```

## Naming Conventions

- Safe migrations: `YYYYMMDD_descriptive_name`
- Destructive sets: `YYYYMMDD_descriptive_name_{expand|data|contract}`
- Backups: `pre_YYYYMMDD_description.sql`

## Production Deployment

```bash
# NEVER use migrate dev in production
# ONLY use migrate deploy (runs reviewed SQL, no prompts)
npx prisma migrate deploy --config $PRISMA_CONFIG
```

## Rollback Strategy

Prisma has no automatic rollback. Options:

1. **Write a new forward migration** that reverses the change
2. **Restore from backup:** `psql $DATABASE_URL < prisma/backups/pre_YYYYMMDD_description.sql`
3. **Mark as rolled back:** `npx prisma migrate resolve --rolled-back <migration_name> --config $PRISMA_CONFIG`

## Emergency Recovery

```bash
# 1. Restore backup
psql $DATABASE_URL < prisma/backups/pre_YYYYMMDD_description.sql

# 2. Mark failed migration as rolled back
npx prisma migrate resolve --rolled-back YYYYMMDD_migration_name --config $PRISMA_CONFIG

# 3. Fix schema.prisma to match restored DB state
# 4. Generate new corrected migration
```
