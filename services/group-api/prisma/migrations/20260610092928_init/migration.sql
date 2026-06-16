-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'BANNED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('OWNER_SEEDED', 'JOIN_REQUESTED', 'JOIN_APPROVED', 'JOIN_REJECTED', 'JOIN_WITHDRAWN', 'ROLE_UPDATED', 'MEMBER_BANNED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOIN_REQUESTED', 'JOIN_APPROVED', 'JOIN_REJECTED', 'ROLE_UPDATED');

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "groupTermId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "bannedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "groupTermId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "answers" JSONB,
    "reviewerWallet" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientWallet" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "groupTermId" TEXT NOT NULL,
    "actorWallet" TEXT NOT NULL,
    "subjectWallet" TEXT,
    "type" "EventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_groupTermId_role_idx" ON "Membership"("groupTermId", "role");

-- CreateIndex
CREATE INDEX "Membership_groupTermId_status_idx" ON "Membership"("groupTermId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_wallet_groupTermId_key" ON "Membership"("wallet", "groupTermId");

-- CreateIndex
CREATE INDEX "Application_groupTermId_status_idx" ON "Application"("groupTermId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_wallet_groupTermId_key" ON "Application"("wallet", "groupTermId");

-- CreateIndex
CREATE INDEX "Notification_recipientWallet_readAt_idx" ON "Notification"("recipientWallet", "readAt");

-- CreateIndex
CREATE INDEX "Event_groupTermId_createdAt_idx" ON "Event"("groupTermId", "createdAt");
