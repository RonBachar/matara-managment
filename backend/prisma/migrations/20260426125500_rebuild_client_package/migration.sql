DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Client'
      AND column_name = 'renewalPrice'
  ) THEN
    ALTER TABLE "Client" RENAME COLUMN "renewalPrice" TO "packagePrice";
  END IF;
END $$;

ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "reminderDaysBefore" INTEGER;

UPDATE "Client"
SET "packageType" = 'none'
WHERE "packageType" IS NULL OR "packageType" = '' OR "packageType" = 'None';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ClientService'
  ) THEN
    WITH ranked_services AS (
      SELECT DISTINCT ON ("clientId")
        "clientId",
        "name",
        "renewalPrice",
        "renewalDate",
        "reminderDaysBefore"
      FROM "ClientService"
      ORDER BY "clientId", "renewalDate" NULLS LAST, "createdAt" ASC
    )
    UPDATE "Client" AS c
    SET
      "packageType" = CASE
        WHEN c."packageType" = 'none' THEN CASE ranked_services."name"
          WHEN 'Hosting' THEN 'Hosting Only'
          WHEN 'Elementor Pro' THEN 'Elementor Pro Only'
          WHEN 'Hosting + Elementor Pro' THEN 'Hosting + Elementor Pro'
          ELSE c."packageType"
        END
        ELSE c."packageType"
      END,
      "packagePrice" = COALESCE(c."packagePrice", ranked_services."renewalPrice"),
      "renewalDate" = COALESCE(c."renewalDate", ranked_services."renewalDate"),
      "reminderDaysBefore" = COALESCE(c."reminderDaysBefore", ranked_services."reminderDaysBefore")
    FROM ranked_services
    WHERE ranked_services."clientId" = c."id";
  END IF;
END $$;

ALTER TABLE "Client"
ALTER COLUMN "packageType" SET DEFAULT 'none',
ALTER COLUMN "packageType" SET NOT NULL;

ALTER TABLE "Client"
DROP COLUMN IF EXISTS "contractFileId",
DROP COLUMN IF EXISTS "contractFileName",
DROP COLUMN IF EXISTS "contractFileType";

DROP TABLE IF EXISTS "ClientService";
