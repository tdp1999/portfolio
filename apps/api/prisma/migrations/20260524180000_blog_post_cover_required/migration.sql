-- PST-011: BlogPost requires featuredImageId.
--
-- Strategy:
--   1. Ensure a "default cover" Media row exists when there are users and at least
--      one blog_posts row with null featuredImageId. (Skipped cleanly on empty
--      shadow DBs — no rows to insert, no rows to backfill.)
--   2. Backfill any blog_posts row with null featuredImageId to point at it.
--      (Soft-deleted rows are backfilled too — keeps consistency on restore.)
--   3. ALTER COLUMN ... SET NOT NULL.

-- ── Step 1: default cover Media row (skipped if no users) ──────────────────
INSERT INTO "media" (
  "id",
  "originalFilename",
  "mimeType",
  "publicId",
  "url",
  "format",
  "bytes",
  "altText",
  "folder",
  "createdAt",
  "updatedAt",
  "createdById",
  "updatedById"
)
SELECT
  gen_random_uuid(),
  'default-cover.jpg',
  'image/jpeg',
  'seed-blog/default-cover',
  'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
  'jpg',
  120000,
  'Default blog cover',
  'seed-blog',
  NOW(),
  NOW(),
  u."id",
  u."id"
FROM "users" u
WHERE u."id" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM "media" WHERE "publicId" = 'seed-blog/default-cover'
  );

-- ── Step 2: backfill null covers (no-op when none exist) ───────────────────
UPDATE "blog_posts"
SET "featuredImageId" = (SELECT "id" FROM "media" WHERE "publicId" = 'seed-blog/default-cover')
WHERE "featuredImageId" IS NULL
  AND EXISTS (SELECT 1 FROM "media" WHERE "publicId" = 'seed-blog/default-cover');

-- ── Step 3: enforce NOT NULL ───────────────────────────────────────────────
ALTER TABLE "blog_posts" ALTER COLUMN "featuredImageId" SET NOT NULL;
