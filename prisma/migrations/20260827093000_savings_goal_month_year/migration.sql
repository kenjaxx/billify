-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "SavingsGoal" ADD COLUMN "month" INTEGER;
ALTER TABLE "SavingsGoal" ADD COLUMN "year" INTEGER;

-- Backfill existing goals using their creation date, so nothing disappears
UPDATE "SavingsGoal"
SET "month" = EXTRACT(MONTH FROM "createdAt")::int,
    "year" = EXTRACT(YEAR FROM "createdAt")::int
WHERE "month" IS NULL;

-- Now that every row has a value, make the columns required
ALTER TABLE "SavingsGoal" ALTER COLUMN "month" SET NOT NULL;
ALTER TABLE "SavingsGoal" ALTER COLUMN "year" SET NOT NULL;

-- CreateIndex
CREATE INDEX "SavingsGoal_userId_year_month_idx" ON "SavingsGoal"("userId", "year", "month");