-- CreateEnum
CREATE TYPE "MemoryKind" AS ENUM ('DOC', 'THREAD', 'DECISION', 'SIGNAL');

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "authorWallet" TEXT NOT NULL,
    "kind" "MemoryKind" NOT NULL DEFAULT 'DOC',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Memory_circleId_departmentId_idx" ON "Memory"("circleId", "departmentId");
