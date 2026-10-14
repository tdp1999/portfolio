-- CreateTable
CREATE TABLE "radar_item_notes" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "triageStatus" "RadarTriageStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_item_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "radar_item_notes_itemId_createdAt_idx" ON "radar_item_notes"("itemId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "radar_item_notes" ADD CONSTRAINT "radar_item_notes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "radar_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

