ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Shift" ADD COLUMN "activeKey" TEXT;
CREATE UNIQUE INDEX "Shift_activeKey_key" ON "Shift"("activeKey");
