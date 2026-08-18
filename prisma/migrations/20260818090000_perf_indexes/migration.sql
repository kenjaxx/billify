-- CreateIndex
CREATE INDEX "Bill_userId_dueDate_idx" ON "Bill"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Bill_userId_status_idx" ON "Bill"("userId", "status");

-- CreateIndex
CREATE INDEX "Bill_categoryId_idx" ON "Bill"("categoryId");

-- CreateIndex
CREATE INDEX "Budget_userId_month_year_idx" ON "Budget"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "Budget_categoryId_idx" ON "Budget"("categoryId");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");