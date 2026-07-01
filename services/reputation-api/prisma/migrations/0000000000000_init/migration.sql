-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ReputationSnapshot" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReputationSnapshot_topicId_rank_idx" ON "ReputationSnapshot"("topicId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ReputationSnapshot_wallet_topicId_key" ON "ReputationSnapshot"("wallet", "topicId");

