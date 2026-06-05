-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('ALLOW', 'CENSOR', 'REJECT', 'STRIKE', 'MANUAL_REVIEW', 'SHADOW_BAN');

-- CreateEnum
CREATE TYPE "WordCategory" AS ENUM ('PROFANITY', 'HATE_SPEECH', 'SEXUAL', 'VIOLENCE', 'THREAT', 'SPAM', 'DISCRIMINATION');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('MESSAGE', 'REVIEW', 'REVIEW_RESPONSE', 'USER_BIO', 'ARTIST_BIO', 'EVENT_DESCRIPTION', 'BOOKING_NOTE', 'USERNAME');

-- CreateTable
CREATE TABLE "BlacklistWord" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "category" "WordCategory" NOT NULL,
    "severity" "Severity" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "variations" BOOLEAN NOT NULL DEFAULT true,
    "partialMatch" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlacklistWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentHash" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "matchedWords" TEXT[],
    "severity" "Severity",
    "shadowBanned" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountStrike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "logId" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolveNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountStrike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistWord_word_key" ON "BlacklistWord"("word");

-- CreateIndex
CREATE INDEX "BlacklistWord_severity_active_idx" ON "BlacklistWord"("severity", "active");

-- CreateIndex
CREATE INDEX "BlacklistWord_category_active_idx" ON "BlacklistWord"("category", "active");

-- CreateIndex
CREATE INDEX "ModerationLog_userId_createdAt_idx" ON "ModerationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationLog_action_createdAt_idx" ON "ModerationLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationLog_contentType_createdAt_idx" ON "ModerationLog"("contentType", "createdAt");

-- CreateIndex
CREATE INDEX "AccountStrike_userId_resolvedAt_idx" ON "AccountStrike"("userId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "AccountStrike" ADD CONSTRAINT "AccountStrike_logId_fkey" FOREIGN KEY ("logId") REFERENCES "ModerationLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
