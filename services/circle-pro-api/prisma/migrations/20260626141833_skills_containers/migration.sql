/*
  Warnings:

  - You are about to drop the `Attribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Endorsement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MemberAttribute` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Endorsement" DROP CONSTRAINT "Endorsement_memberAttributeId_fkey";

-- DropForeignKey
ALTER TABLE "MemberAttribute" DROP CONSTRAINT "MemberAttribute_attributeId_fkey";

-- DropTable
DROP TABLE "Attribute";

-- DropTable
DROP TABLE "Endorsement";

-- DropTable
DROP TABLE "MemberAttribute";

-- DropEnum
DROP TYPE "AttributeKind";

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "topic" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillUrl" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillUrlVote" (
    "id" TEXT NOT NULL,
    "skillUrlId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillUrlVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTool" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT,

    CONSTRAINT "SkillTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Skill_circleId_departmentId_idx" ON "Skill"("circleId", "departmentId");

-- CreateIndex
CREATE INDEX "SkillUrl_skillId_idx" ON "SkillUrl"("skillId");

-- CreateIndex
CREATE INDEX "SkillUrlVote_skillUrlId_idx" ON "SkillUrlVote"("skillUrlId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillUrlVote_skillUrlId_wallet_key" ON "SkillUrlVote"("skillUrlId", "wallet");

-- CreateIndex
CREATE INDEX "SkillTool_skillId_idx" ON "SkillTool"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTool_skillId_name_key" ON "SkillTool"("skillId", "name");

-- AddForeignKey
ALTER TABLE "SkillUrl" ADD CONSTRAINT "SkillUrl_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillUrlVote" ADD CONSTRAINT "SkillUrlVote_skillUrlId_fkey" FOREIGN KEY ("skillUrlId") REFERENCES "SkillUrl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTool" ADD CONSTRAINT "SkillTool_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
