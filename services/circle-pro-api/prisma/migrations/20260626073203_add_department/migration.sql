-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "departmentId" TEXT;

-- CreateIndex
CREATE INDEX "Bookmark_circleId_departmentId_idx" ON "Bookmark"("circleId", "departmentId");
