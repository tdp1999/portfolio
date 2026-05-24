-- CreateTable
CREATE TABLE "about_principles" (
    "id" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "claim" JSONB NOT NULL,
    "expansion" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_principles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "about_principles_order_idx" ON "about_principles"("order");

-- CreateIndex
CREATE INDEX "about_principles_isPublished_order_idx" ON "about_principles"("isPublished", "order");
