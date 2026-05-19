-- Add columns paymentAmount and changeAmount to Order
ALTER TABLE "Order" ADD COLUMN "paymentAmount" INTEGER;
ALTER TABLE "Order" ADD COLUMN "changeAmount" INTEGER;
