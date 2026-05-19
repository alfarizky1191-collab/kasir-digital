-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "orderId" TEXT,
    "cashierName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL
);
