-- CreateTable
CREATE TABLE "Profile" (
    "wallet" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarSeed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "bookmarkKey" TEXT NOT NULL,
    "circleId" TEXT NOT NULL DEFAULT 'acme',
    "authorWallet" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_handle_key" ON "Profile"("handle");

-- CreateIndex
CREATE INDEX "Comment_bookmarkKey_circleId_createdAt_idx" ON "Comment"("bookmarkKey", "circleId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_authorWallet_idx" ON "Comment"("authorWallet");

-- CreateIndex
CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_wallet_key" ON "CommentLike"("commentId", "wallet");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorWallet_fkey" FOREIGN KEY ("authorWallet") REFERENCES "Profile"("wallet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
