-- prisma/migrations/20260909050000_budget_envelopes/migration.sql

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN "name" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "budgetId" TEXT;

-- CreateIndex
CREATE INDEX "Expense_budgetId_idx" ON "Expense"("budgetId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;