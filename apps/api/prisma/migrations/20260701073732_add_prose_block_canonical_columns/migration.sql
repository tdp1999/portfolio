-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN     "contentCanonical" JSONB;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "bodyCanonical" JSONB;
