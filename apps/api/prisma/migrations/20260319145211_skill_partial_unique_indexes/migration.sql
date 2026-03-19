-- DropIndex: remove absolute unique indexes (replaced by partial indexes in next migration)
DROP INDEX "skills_name_key";
DROP INDEX "skills_slug_key";
