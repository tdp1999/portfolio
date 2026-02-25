-- Copy passwordHash → password
UPDATE "users" SET "password" = "passwordHash" WHERE "password" IS NULL;

-- Make password NOT NULL
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;
