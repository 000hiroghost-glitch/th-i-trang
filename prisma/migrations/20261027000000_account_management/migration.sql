-- Add profile, account security, and password reset support.
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'UNSPECIFIED');

ALTER TABLE "User"
    ADD COLUMN "avatar" TEXT,
    ADD COLUMN "dateOfBirth" DATE,
    ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    ADD COLUMN "allowMarketingEmails" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "orderStatusNotifications" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'vi',
    ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "AccountAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccountAddress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_createdAt_idx" ON "PasswordResetToken"("userId", "createdAt");
CREATE UNIQUE INDEX "AccountAddress_one_default_per_user_key"
    ON "AccountAddress"("userId") WHERE "isDefault" = true;

ALTER TABLE "AccountAddress"
    ADD CONSTRAINT "AccountAddress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
