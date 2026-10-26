ALTER TABLE "Banner"
    ADD COLUMN "discountPercent" INTEGER;

ALTER TABLE "Order"
    ADD COLUMN "customerName" TEXT,
    ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    ADD COLUMN "isInstallment" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "installmentMonths" INTEGER,
    ADD COLUMN "installmentProvider" TEXT,
    ADD COLUMN "installmentVerificationStatus" TEXT,
    ADD COLUMN "discountCode" TEXT,
    ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "shippingAddressId" TEXT;

ALTER TABLE "Order"
    ADD CONSTRAINT "Order_shippingAddressId_fkey"
    FOREIGN KEY ("shippingAddressId") REFERENCES "AccountAddress"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
