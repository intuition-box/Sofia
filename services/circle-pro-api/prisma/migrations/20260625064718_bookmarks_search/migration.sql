-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "circleId" TEXT NOT NULL DEFAULT 'acme',
    "authorWallet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookmarkTag" (
    "id" TEXT NOT NULL,
    "bookmarkId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "BookmarkTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bookmark_circleId_createdAt_idx" ON "Bookmark"("circleId", "createdAt");

-- CreateIndex
CREATE INDEX "Bookmark_normalizedUrl_idx" ON "Bookmark"("normalizedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_authorWallet_normalizedUrl_circleId_key" ON "Bookmark"("authorWallet", "normalizedUrl", "circleId");

-- CreateIndex
CREATE INDEX "BookmarkTag_bookmarkId_idx" ON "BookmarkTag"("bookmarkId");

-- CreateIndex
CREATE INDEX "BookmarkTag_tagId_idx" ON "BookmarkTag"("tagId");

-- CreateIndex
CREATE INDEX "BookmarkTag_label_idx" ON "BookmarkTag"("label");

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_authorWallet_fkey" FOREIGN KEY ("authorWallet") REFERENCES "Profile"("wallet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkTag" ADD CONSTRAINT "BookmarkTag_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "Bookmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;
