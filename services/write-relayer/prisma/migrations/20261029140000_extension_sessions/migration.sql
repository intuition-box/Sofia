-- Extension sessions: the Sofia extension calls the relayer with a long-lived
-- token issued to a signed-in Privy account (only its hash is stored)

-- CreateTable
CREATE TABLE "ExtensionSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ExtensionSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionSession_tokenHash_key" ON "ExtensionSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ExtensionSession_privyUserId_idx" ON "ExtensionSession"("privyUserId");
