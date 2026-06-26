-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_circleId_idx" ON "Department"("circleId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_circleId_name_key" ON "Department"("circleId", "name");
