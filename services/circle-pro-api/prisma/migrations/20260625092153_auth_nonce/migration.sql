-- CreateTable
CREATE TABLE "AuthNonce" (
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "AuthNonce_pkey" PRIMARY KEY ("value")
);

-- CreateIndex
CREATE INDEX "AuthNonce_createdAt_idx" ON "AuthNonce"("createdAt");
