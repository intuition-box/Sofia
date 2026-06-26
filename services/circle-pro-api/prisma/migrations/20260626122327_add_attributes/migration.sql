-- CreateEnum
CREATE TYPE "AttributeKind" AS ENUM ('SKILL', 'TOOL');

-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "kind" "AttributeKind" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberAttribute" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endorsement" (
    "id" TEXT NOT NULL,
    "memberAttributeId" TEXT NOT NULL,
    "endorserWallet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attribute_circleId_kind_idx" ON "Attribute"("circleId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_circleId_kind_name_key" ON "Attribute"("circleId", "kind", "name");

-- CreateIndex
CREATE INDEX "MemberAttribute_circleId_wallet_idx" ON "MemberAttribute"("circleId", "wallet");

-- CreateIndex
CREATE INDEX "MemberAttribute_attributeId_idx" ON "MemberAttribute"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAttribute_wallet_attributeId_key" ON "MemberAttribute"("wallet", "attributeId");

-- CreateIndex
CREATE INDEX "Endorsement_memberAttributeId_idx" ON "Endorsement"("memberAttributeId");

-- CreateIndex
CREATE UNIQUE INDEX "Endorsement_memberAttributeId_endorserWallet_key" ON "Endorsement"("memberAttributeId", "endorserWallet");

-- AddForeignKey
ALTER TABLE "MemberAttribute" ADD CONSTRAINT "MemberAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_memberAttributeId_fkey" FOREIGN KEY ("memberAttributeId") REFERENCES "MemberAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
