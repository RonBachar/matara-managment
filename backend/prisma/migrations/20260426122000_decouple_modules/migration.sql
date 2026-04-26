ALTER TABLE "Project"
DROP COLUMN IF EXISTS "clientId";

ALTER TABLE "Lead"
DROP COLUMN IF EXISTS "convertedClientId",
DROP COLUMN IF EXISTS "agreementFileId",
DROP COLUMN IF EXISTS "agreementFileName",
DROP COLUMN IF EXISTS "agreementFileType";

ALTER TABLE "ProjectBrief"
ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';

UPDATE "ProjectBrief"
SET "title" = COALESCE(
    NULLIF("data"->>'title', ''),
    NULLIF("data"->>'projectNameSnapshot', ''),
    NULLIF("data"->>'briefTitle', ''),
    ''
);

UPDATE "ProjectBrief"
SET "data" = (
    COALESCE("data", '{}'::jsonb)
    - 'projectId'
    - 'clientId'
    - 'projectNameSnapshot'
    - 'clientNameSnapshot'
    - 'briefTitle'
) || jsonb_build_object('title', "title");

ALTER TABLE "ProjectBrief"
DROP CONSTRAINT IF EXISTS "ProjectBrief_projectId_fkey";

DROP INDEX IF EXISTS "ProjectBrief_projectId_idx";
DROP INDEX IF EXISTS "ProjectBrief_projectId_key";

ALTER TABLE "ProjectBrief"
DROP COLUMN IF EXISTS "projectId";
