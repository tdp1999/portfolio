# Expand → Data Migration → Contract SQL Templates

Ready-made SQL templates for each destructive scenario. Replace placeholders with actual values.

---

## 1. Rename Column

### Expand
```sql
-- No expand needed — use direct RENAME (Prisma generates DROP+ADD, so edit the SQL)
```

### Data Migration
```sql
-- Not needed
```

### Contract (single migration, edit the generated SQL)
```sql
ALTER TABLE "{table}" RENAME COLUMN "{old_name}" TO "{new_name}";
```

**Note:** Delete Prisma's generated DROP+ADD and replace with this single RENAME.

---

## 2. Change Column Type (Incompatible)

### Expand
```sql
ALTER TABLE "{table}" ADD COLUMN "{col}_new" {new_type};
```

### Data Migration (user provides the CASE logic)
```sql
UPDATE "{table}" SET "{col}_new" = CASE
  -- USER LOGIC HERE. Examples:
  -- WHEN "{col}" IS NOT NULL AND "{col}" != '' THEN 1 ELSE 0 END;
  -- WHEN "{col}" = 'active' THEN TRUE ELSE FALSE END;
  -- WHEN "{col}" ~ '^\d+$' THEN "{col}"::INTEGER ELSE 0 END;
END;

-- If target column should be NOT NULL:
ALTER TABLE "{table}" ALTER COLUMN "{col}_new" SET NOT NULL;
```

### Contract
```sql
ALTER TABLE "{table}" DROP COLUMN "{col}";
ALTER TABLE "{table}" RENAME COLUMN "{col}_new" TO "{col}";
```

---

## 3. Change Column Type (Narrowing, e.g., VARCHAR(255) → VARCHAR(50))

### Expand
```sql
ALTER TABLE "{table}" ADD COLUMN "{col}_new" VARCHAR({new_length});
```

### Data Migration (user decides truncation strategy)
```sql
UPDATE "{table}" SET "{col}_new" = CASE
  -- Option A: Truncate
  WHEN LENGTH("{col}") > {new_length} THEN LEFT("{col}", {new_length})
  ELSE "{col}"
END;

-- USER MAY PROVIDE ALTERNATIVE: reject, abbreviate, etc.
```

### Contract
```sql
ALTER TABLE "{table}" DROP COLUMN "{col}";
ALTER TABLE "{table}" RENAME COLUMN "{col}_new" TO "{col}";
```

---

## 4. Add NOT NULL to Nullable Column

### Single Migration (edit generated SQL)
```sql
-- Backfill NULLs first (user provides default value)
UPDATE "{table}" SET "{col}" = '{default_value}' WHERE "{col}" IS NULL;

-- Then add constraint
ALTER TABLE "{table}" ALTER COLUMN "{col}" SET NOT NULL;
```

---

## 5. Add Unique Constraint (Duplicates Exist)

### Data Migration (user provides dedup strategy)
```sql
-- Option A: Keep first occurrence, delete rest
DELETE FROM "{table}" a USING "{table}" b
WHERE a.id > b.id AND a."{col}" = b."{col}";

-- Option B: Keep most recent
DELETE FROM "{table}" a USING "{table}" b
WHERE a."updatedAt" < b."updatedAt" AND a."{col}" = b."{col}";

-- Option C: User provides custom merge logic
```

### Then apply constraint
```sql
ALTER TABLE "{table}" ADD CONSTRAINT "{table}_{col}_key" UNIQUE ("{col}");
-- Or: CREATE UNIQUE INDEX "{table}_{col}_key" ON "{table}"("{col}");
```

---

## 6. Remove Enum Value

### Expand
```sql
-- Create new enum type without the removed value
CREATE TYPE "{EnumName}_new" AS ENUM ({remaining_values});
```

### Data Migration (user provides replacement value)
```sql
-- Migrate rows using removed value
UPDATE "{table}" SET "{col}" = '{replacement_value}' WHERE "{col}" = '{removed_value}';
```

### Contract
```sql
-- Swap enum types
ALTER TABLE "{table}" ALTER COLUMN "{col}" TYPE "{EnumName}_new" USING "{col}"::text::"{EnumName}_new";
DROP TYPE "{EnumName}";
ALTER TYPE "{EnumName}_new" RENAME TO "{EnumName}";
```

---

## 7. Rename Enum Value

### Expand
```sql
-- Add new value to existing enum
ALTER TYPE "{EnumName}" ADD VALUE '{new_value}';
```

### Data Migration
```sql
UPDATE "{table}" SET "{col}" = '{new_value}' WHERE "{col}" = '{old_value}';
```

### Contract
```sql
-- PostgreSQL cannot remove enum values directly, must recreate
CREATE TYPE "{EnumName}_new" AS ENUM ({values_without_old});
ALTER TABLE "{table}" ALTER COLUMN "{col}" TYPE "{EnumName}_new" USING "{col}"::text::"{EnumName}_new";
DROP TYPE "{EnumName}";
ALTER TYPE "{EnumName}_new" RENAME TO "{EnumName}";
```

---

## 8. Rename Table

### Single Migration (edit generated SQL)
```sql
-- Replace Prisma's DROP+CREATE with:
ALTER TABLE "{old_name}" RENAME TO "{new_name}";
```

---

## 9. Add Required Foreign Key to Existing Table

### Expand
```sql
-- Add as nullable first
ALTER TABLE "{table}" ADD COLUMN "{fk_col}" TEXT REFERENCES "{other_table}"("id");
```

### Data Migration (user provides backfill strategy)
```sql
-- Option A: Link to a default record
UPDATE "{table}" SET "{fk_col}" = '{default_record_id}';

-- Option B: User provides mapping logic
-- UPDATE "{table}" SET "{fk_col}" = (SELECT id FROM "{other_table}" WHERE ...);
```

### Contract
```sql
ALTER TABLE "{table}" ALTER COLUMN "{fk_col}" SET NOT NULL;
```

---

## 10. Drop Table (with backup)

### Pre-migration backup
```sql
-- Create backup table (stays in DB as safety net)
CREATE TABLE "{table}_backup" AS SELECT * FROM "{table}";
```

### Migration
```sql
DROP TABLE "{table}";
```

### Post-validation cleanup (separate migration, after confirming)
```sql
DROP TABLE IF EXISTS "{table}_backup";
```

---

## 11. Drop Column (with backup)

### Pre-migration backup
```sql
-- Add backup column or use pg_dump
ALTER TABLE "{table}" ADD COLUMN "{col}_backup" {type};
UPDATE "{table}" SET "{col}_backup" = "{col}";
```

### Migration
```sql
ALTER TABLE "{table}" DROP COLUMN "{col}";
```

### Post-validation cleanup
```sql
ALTER TABLE "{table}" DROP COLUMN IF EXISTS "{col}_backup";
```
