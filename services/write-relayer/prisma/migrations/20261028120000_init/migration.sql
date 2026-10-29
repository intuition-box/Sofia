-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WriteStatus" AS ENUM ('reserved', 'sent', 'failed');

-- CreateTable
CREATE TABLE "SponsoredWrite" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "objectIds" TEXT[],
    "recommendCount" INTEGER NOT NULL,
    "tagCount" INTEGER NOT NULL,
    "costWei" DECIMAL(78,0) NOT NULL,
    "txHashes" TEXT[],
    "status" "WriteStatus" NOT NULL DEFAULT 'reserved',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsoredWrite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsoredWrite_privyUserId_createdAt_idx" ON "SponsoredWrite"("privyUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SponsoredWrite_createdAt_status_idx" ON "SponsoredWrite"("createdAt", "status");

