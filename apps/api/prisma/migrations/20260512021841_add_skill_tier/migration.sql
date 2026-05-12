-- CreateEnum
CREATE TYPE "SkillTier" AS ENUM ('DAILY', 'FREQUENT', 'SHIPPED');

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "tier" "SkillTier" NOT NULL DEFAULT 'FREQUENT';
