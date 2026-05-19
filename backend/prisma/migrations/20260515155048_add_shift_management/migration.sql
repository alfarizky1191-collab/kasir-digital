-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cashierName" TEXT NOT NULL,
    "openingCash" INTEGER NOT NULL,
    "closingCash" INTEGER,
    "expectedCash" INTEGER,
    "actualCash" INTEGER,
    "difference" INTEGER,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "openedAt" DATETIME NOT NULL,
    "closedAt" DATETIME
);
