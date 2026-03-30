-- CreateEnum
CREATE TYPE "ContactPurpose" AS ENUM ('GENERAL', 'JOB_OPPORTUNITY', 'FREELANCE', 'COLLABORATION', 'BUG_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "purpose" "ContactPurpose" NOT NULL DEFAULT 'GENERAL',
    "subject" VARCHAR(500),
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'UNREAD',
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "locale" VARCHAR(5) NOT NULL DEFAULT 'en',
    "consentGivenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_messages_status_deletedAt_idx" ON "contact_messages"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

-- CreateIndex
CREATE INDEX "contact_messages_expiresAt_idx" ON "contact_messages"("expiresAt");

-- CreateIndex
CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");
