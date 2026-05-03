-- Portfolio landing fields migration
-- Strategy: ADD new columns → COPY data from legacy columns → DROP legacy columns
-- Preserves: profiles.timezone → profiles.timezones[]
--            projects.sourceUrl → projects.links[{type: 'repo'}]
--            projects.projectUrl → projects.links[{type: 'demo'}]

-- ──────────────────────────────────────────────────────────────────
-- Drift cleanup: indexes present in DB but absent from schema
-- ──────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS "blog_posts_slug_active_key";
DROP INDEX IF EXISTS "categories_name_active_key";
DROP INDEX IF EXISTS "categories_slug_active_key";
DROP INDEX IF EXISTS "experiences_slug_active_key";
DROP INDEX IF EXISTS "projects_slug_active_key";
DROP INDEX IF EXISTS "tags_name_active_key";
DROP INDEX IF EXISTS "tags_slug_active_key";

-- ──────────────────────────────────────────────────────────────────
-- Step 1: ADD new columns (Profile + Project)
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE "profiles"
  ADD COLUMN "tagline"       JSONB,
  ADD COLUMN "stackIntro"    JSONB,
  ADD COLUMN "contactIntro"  JSONB,
  ADD COLUMN "footerTagline" JSONB,
  ADD COLUMN "timezones"     JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "projects"
  ADD COLUMN "body"  JSONB,
  ADD COLUMN "links" JSONB NOT NULL DEFAULT '[]';

-- ──────────────────────────────────────────────────────────────────
-- Step 2: COPY legacy data into new columns
-- ──────────────────────────────────────────────────────────────────

-- profiles.timezone (single string) → profiles.timezones (array)
UPDATE "profiles"
SET "timezones" = jsonb_build_array("timezone")
WHERE "timezone" IS NOT NULL;

-- projects.sourceUrl + projects.projectUrl → projects.links (array of {label,url,type})
UPDATE "projects"
SET "links" = (
  COALESCE(
    CASE WHEN "sourceUrl" IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('label', 'Source', 'url', "sourceUrl", 'type', 'repo'))
      ELSE '[]'::jsonb
    END,
    '[]'::jsonb
  )
  ||
  COALESCE(
    CASE WHEN "projectUrl" IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('label', 'Live', 'url', "projectUrl", 'type', 'demo'))
      ELSE '[]'::jsonb
    END,
    '[]'::jsonb
  )
)
WHERE "sourceUrl" IS NOT NULL OR "projectUrl" IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────
-- Step 3: DROP legacy columns
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE "profiles" DROP COLUMN "timezone";
ALTER TABLE "projects" DROP COLUMN "projectUrl";
ALTER TABLE "projects" DROP COLUMN "sourceUrl";
