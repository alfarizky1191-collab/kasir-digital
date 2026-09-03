ALTER TABLE "Order"
  ADD COLUMN "voidedAt" TIMESTAMP(3),
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "voidReason" TEXT,
  ADD COLUMN "refundReason" TEXT,
  ADD COLUMN "paidById" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "userId" TEXT, ADD COLUMN "metadata" JSONB;

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "username" TEXT NOT NULL, "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL, "role" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "Product" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "price" INTEGER NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Menu', "imageUrl" TEXT, "stock" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "hasLevel" BOOLEAN NOT NULL DEFAULT false,
  "hasType" BOOLEAN NOT NULL DEFAULT false, "flavors" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

INSERT INTO "Product" ("id","name","price","category","imageUrl","stock","isActive","hasLevel","hasType","flavors","createdAt","updatedAt") VALUES
('prod-batagor','Batagor',5000,'Makanan','https://i.imgur.com/JiFateR.jpeg',NULL,true,false,true,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-mie-level','Mie Level',8000,'Makanan','https://i.imgur.com/u6FXtL7.jpeg',NULL,true,true,false,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-cilok','Cilok',5000,'Makanan','https://i.imgur.com/xvHP2rG.jpeg',NULL,true,false,false,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-es-milo-full','Es Potong Milo (full)',4000,'Minuman','https://i.imgur.com/3ilf7yY.jpeg',NULL,true,false,false,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-es-milo-half','Es Potong Milo (half)',2000,'Minuman','https://i.imgur.com/3ilf7yY.jpeg',NULL,true,false,false,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-real-good-full','Es Potong Real good (full)',2000,'Minuman','https://i.imgur.com/3ilf7yY.jpeg',NULL,true,false,false,ARRAY['coklat','strawberry','blueberry','guava','blackcurrant']::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-real-good-half','Es Potong Real good (1/2)',1000,'Minuman','https://i.imgur.com/3ilf7yY.jpeg',NULL,true,false,false,ARRAY['coklat','strawberry','blueberry','guava','blackcurrant']::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-suki','Suki Bakar',5000,'Makanan','https://i.imgur.com/LPkTB2B.jpeg',NULL,true,false,false,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-sosis','Sosis Bakar',5000,'Makanan','https://i.imgur.com/ZxwgE0.jpeg',NULL,true,false,false,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-jasuke','Jasuke',5000,'Makanan','https://i.imgur.com/OGNZogQ.jpeg',NULL,true,false,false,ARRAY[]::TEXT[],CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
