-- CreateTable
CREATE TABLE "AiInsightCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsightCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiInsightCache_userId_key" ON "AiInsightCache"("userId");

-- AddForeignKey
ALTER TABLE "AiInsightCache" ADD CONSTRAINT "AiInsightCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;