# Destructive SQL Pattern Detection

When reviewing generated `migration.sql` files, scan for these patterns to classify risk.

## Pattern Detection Rules

### Data Loss Patterns

```sql
-- DROP COLUMN: permanent data loss
ALTER TABLE "TableName" DROP COLUMN "column_name";

-- DROP TABLE: entire table data lost
DROP TABLE "TableName";

-- Prisma's "rename" (actually DROP + ADD):
ALTER TABLE "TableName" DROP COLUMN "old_name";
ALTER TABLE "TableName" ADD COLUMN "new_name" <type>;
-- Detection: DROP COLUMN + ADD COLUMN with same table in same migration
```

### Constraint Failure Patterns

```sql
-- NOT NULL without DEFAULT on existing table:
ALTER TABLE "TableName" ALTER COLUMN "col" SET NOT NULL;
-- Fails if any row has NULL in "col"

-- NOT NULL column added without default:
ALTER TABLE "TableName" ADD COLUMN "col" TEXT NOT NULL;
-- Fails if table has existing rows

-- UNIQUE constraint:
ALTER TABLE "TableName" ADD CONSTRAINT "unique_name" UNIQUE ("col");
CREATE UNIQUE INDEX "idx_name" ON "TableName"("col");
-- Fails if duplicate values exist
```

### Type Change Patterns

```sql
-- Incompatible type cast:
ALTER TABLE "TableName" ALTER COLUMN "col" TYPE INTEGER USING "col"::INTEGER;
-- Fails if non-numeric data exists

-- Narrowing cast:
ALTER TABLE "TableName" ALTER COLUMN "col" TYPE VARCHAR(50);
-- Truncates data longer than 50 chars
```

### Enum Patterns

```sql
-- Remove enum value (PostgreSQL):
-- Prisma typically recreates the enum entirely:
CREATE TYPE "NewEnum" AS ENUM ('A', 'B');  -- 'C' was removed
ALTER TABLE "TableName" ALTER COLUMN "col" TYPE "NewEnum" USING "col"::text::"NewEnum";
DROP TYPE "OldEnum";
-- Fails if any row has the removed value

-- Rename enum value: same as remove + add
```

### Relation Patterns

```sql
-- Required FK on existing table:
ALTER TABLE "TableName" ADD COLUMN "fk_id" TEXT NOT NULL REFERENCES "Other"("id");
-- Fails if table has existing rows (no default FK value)

-- Cascade delete added:
ALTER TABLE "TableName" ADD CONSTRAINT "fk_name"
  FOREIGN KEY ("col") REFERENCES "Other"("id") ON DELETE CASCADE;
-- Safe schema-wise but changes runtime behavior (deletes cascade now)
```

## Quick Scan Checklist

When reading a `migration.sql`, check for:

| SQL Keyword/Pattern | Risk Level | Action |
|---|---|---|
| `DROP COLUMN` | **Data loss** | Require backup + confirm |
| `DROP TABLE` | **Data loss** | Require backup + confirm |
| `SET NOT NULL` (on existing column) | **Destructive** | Check for NULLs first |
| `ADD COLUMN ... NOT NULL` (no DEFAULT) | **Destructive** | Check if table has rows |
| `UNIQUE` / `CREATE UNIQUE INDEX` | **Risky** | Check for duplicates |
| `ALTER COLUMN ... TYPE` | **Risky/Destructive** | Check data compatibility |
| `DROP TYPE` + `CREATE TYPE` (enum) | **Destructive** | Check enum value usage |
| `REFERENCES` + `NOT NULL` (new FK) | **Destructive** | Check if table has rows |
| `ON DELETE CASCADE` (new/changed) | **Behavioral** | Warn user |
| `ADD COLUMN ... DEFAULT` | Safe | Review only |
| `CREATE TABLE` | Safe | Review only |
| `CREATE INDEX` (non-unique) | Safe | Review only |

## Automated Detection Approach

When analyzing a migration SQL file:

1. Read the entire SQL file
2. For each statement, match against patterns above
3. Classify as: **safe**, **risky**, or **destructive**
4. If any destructive pattern found → trigger backup + expand/contract workflow
5. If risky → warn user, ask for confirmation
6. If all safe → proceed with review
