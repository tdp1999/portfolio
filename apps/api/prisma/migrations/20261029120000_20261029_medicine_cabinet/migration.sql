-- CreateEnum
CREATE TYPE "MedicalItemKind" AS ENUM ('MEDICINE', 'SUPPLY');

-- CreateEnum
CREATE TYPE "MedicineTiming" AS ENUM ('BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL', 'ANY_TIME');

-- CreateEnum
CREATE TYPE "MedicineUsageType" AS ENUM ('LONG_TERM', 'COURSE');

-- CreateTable
CREATE TABLE "health_profiles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" UUID,

    CONSTRAINT "health_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_items" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "kind" "MedicalItemKind" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "activeIngredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strength" VARCHAR(50),
    "dose" VARCHAR(100),
    "timing" "MedicineTiming",
    "usageType" "MedicineUsageType",
    "purpose" VARCHAR(500),
    "note" VARCHAR(2000),
    "packForTravel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" UUID,

    CONSTRAINT "medical_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_items_profileId_deletedAt_idx" ON "medical_items"("profileId", "deletedAt");

-- CreateIndex
CREATE INDEX "medical_items_updatedAt_idx" ON "medical_items"("updatedAt");

-- AddForeignKey
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_items" ADD CONSTRAINT "medical_items_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "health_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_items" ADD CONSTRAINT "medical_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_items" ADD CONSTRAINT "medical_items_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_items" ADD CONSTRAINT "medical_items_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateIndex (hand-written): a person name is unique ignoring case among people not deleted (SR-005, Q-21, Q-28).
-- Prisma cannot express a partial expression index, so the schema only documents it.
CREATE UNIQUE INDEX "health_profiles_lower_name_active_key" ON "health_profiles" (lower("name")) WHERE "deletedAt" IS NULL;
