-- Replace global unique constraints with partial unique indexes filtered by `deletedAt IS NULL`.
-- Allows slugs/names from soft-deleted rows to be reused by new active rows.
-- Prisma cannot model partial indexes in the schema, so the *_active_key indexes are managed manually here.

-- Tag
DROP INDEX "tags_name_key";
DROP INDEX "tags_slug_key";
CREATE INDEX "tags_name_idx" ON "tags"("name");
CREATE INDEX "tags_slug_idx" ON "tags"("slug");
CREATE UNIQUE INDEX "tags_name_active_key" ON "tags" ("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "tags_slug_active_key" ON "tags" ("slug") WHERE "deletedAt" IS NULL;

-- Category
DROP INDEX "categories_name_key";
DROP INDEX "categories_slug_key";
CREATE INDEX "categories_name_idx" ON "categories"("name");
CREATE INDEX "categories_slug_idx" ON "categories"("slug");
CREATE UNIQUE INDEX "categories_name_active_key" ON "categories" ("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "categories_slug_active_key" ON "categories" ("slug") WHERE "deletedAt" IS NULL;

-- Experience
DROP INDEX "experiences_slug_key";
CREATE INDEX "experiences_slug_idx" ON "experiences"("slug");
CREATE UNIQUE INDEX "experiences_slug_active_key" ON "experiences" ("slug") WHERE "deletedAt" IS NULL;

-- Project
DROP INDEX "projects_slug_key";
CREATE INDEX "projects_slug_idx" ON "projects"("slug");
CREATE UNIQUE INDEX "projects_slug_active_key" ON "projects" ("slug") WHERE "deletedAt" IS NULL;

-- BlogPost
DROP INDEX "blog_posts_slug_key";
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");
CREATE UNIQUE INDEX "blog_posts_slug_active_key" ON "blog_posts" ("slug") WHERE "deletedAt" IS NULL;
