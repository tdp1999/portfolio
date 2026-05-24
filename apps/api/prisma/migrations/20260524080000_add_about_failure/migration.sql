-- CreateTable
CREATE TABLE "about_failures" (
    "id" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "context" JSONB NOT NULL,
    "decision" JSONB NOT NULL,
    "consequence" JSONB NOT NULL,
    "lesson" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_failures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "about_failures_order_idx" ON "about_failures"("order");

-- CreateIndex
CREATE INDEX "about_failures_isPublished_order_idx" ON "about_failures"("isPublished", "order");
