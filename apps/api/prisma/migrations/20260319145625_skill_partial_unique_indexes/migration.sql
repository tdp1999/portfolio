-- Prisma auto-dropped the partial unique indexes from the previous migration.
-- Re-create partial unique indexes that exclude soft-deleted rows.
CREATE UNIQUE INDEX "skills_name_active_key" ON "skills" ("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "skills_slug_active_key" ON "skills" ("slug") WHERE "deletedAt" IS NULL;
