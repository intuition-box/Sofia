-- Second opinions: recommends / opposes on pages only one person recommended,
-- sponsored outside the Recommend quota (their own daily cap)

-- CreateEnum
CREATE TYPE "WriteKind" AS ENUM ('recommend', 'oppose');

-- AlterTable
ALTER TABLE "SponsoredWrite"
    ADD COLUMN "kind" "WriteKind" NOT NULL DEFAULT 'recommend',
    ADD COLUMN "opinionCount" INTEGER NOT NULL DEFAULT 0;
