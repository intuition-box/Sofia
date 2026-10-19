-- CreateTable
CREATE TABLE "TrendHunterMonth" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "flair" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "calls" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendHunterMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarlySignal" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "leadDays" INTEGER NOT NULL,
    "followers" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "pageLabel" TEXT,
    "pageUrl" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarlySignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendHunterMonth_month_rank_idx" ON "TrendHunterMonth"("month", "rank");

-- CreateIndex
CREATE INDEX "TrendHunterMonth_wallet_idx" ON "TrendHunterMonth"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "TrendHunterMonth_month_wallet_key" ON "TrendHunterMonth"("month", "wallet");

-- CreateIndex
CREATE INDEX "EarlySignal_month_rank_idx" ON "EarlySignal"("month", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "EarlySignal_month_claimId_key" ON "EarlySignal"("month", "claimId");
