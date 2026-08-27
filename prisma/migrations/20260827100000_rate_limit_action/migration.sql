-- AlterTable
ALTER TABLE "AiRequestLog" ADD COLUMN "action" TEXT NOT NULL DEFAULT 'ai';

-- DropIndex
DROP INDEX IF EXISTS "AiRequestLog_userId_createdAt_idx";

-- CreateIndex
CREATE INDEX "AiRequestLog_userId_action_createdAt_idx" ON "AiRequestLog"("userId", "action", "createdAt");