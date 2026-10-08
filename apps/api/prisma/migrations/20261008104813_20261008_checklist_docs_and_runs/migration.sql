-- CreateEnum
CREATE TYPE "ChecklistDocKind" AS ENUM ('TEMPLATE', 'LOOKUP', 'PROJECT');

-- CreateEnum
CREATE TYPE "ChecklistRunStatus" AS ENUM ('ACTIVE', 'DONE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "checklist_docs" (
    "id" UUID NOT NULL,
    "kind" "ChecklistDocKind" NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" JSONB NOT NULL,
    "sourceHash" VARCHAR(64) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_runs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "templateSlug" VARCHAR(100) NOT NULL,
    "templateTitle" VARCHAR(200) NOT NULL,
    "projectSlug" VARCHAR(100) NOT NULL,
    "status" "ChecklistRunStatus" NOT NULL DEFAULT 'ACTIVE',
    "body" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_docs_kind_slug_key" ON "checklist_docs"("kind", "slug");

-- CreateIndex
CREATE INDEX "checklist_runs_status_updatedAt_idx" ON "checklist_runs"("status", "updatedAt" DESC);
