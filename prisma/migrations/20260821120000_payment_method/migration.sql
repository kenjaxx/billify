-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'GCASH', 'MAYA', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER');

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "paymentMethod" "PaymentMethod";