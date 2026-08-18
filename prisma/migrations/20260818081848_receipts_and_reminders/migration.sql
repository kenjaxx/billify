-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "receiptName" TEXT,
ADD COLUMN     "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reminderDays" INTEGER NOT NULL DEFAULT 7;
