-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "emailKey" TEXT,
ADD COLUMN     "phoneKey" TEXT,
ADD COLUMN     "serviceType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "submissionCount" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Lead_userId_phoneKey_idx" ON "Lead"("userId", "phoneKey");

-- CreateIndex
CREATE INDEX "Lead_userId_emailKey_idx" ON "Lead"("userId", "emailKey");


-- Backfill the matching keys for leads that already existed, using the same
-- rule as phoneKeyOf/emailKeyOf in server/utils/leadMatching.ts, so a repeat
-- enquiry recognises a lead created before this migration.
UPDATE "Lead"
SET "phoneKey" = CASE
      WHEN LENGTH(REGEXP_REPLACE(COALESCE("phone", ''), '\D', '', 'g')) >= 9
      THEN RIGHT(REGEXP_REPLACE("phone", '\D', '', 'g'), 9)
      ELSE NULL
    END,
    "emailKey" = NULLIF(LOWER(TRIM(COALESCE("email", ''))), '');
