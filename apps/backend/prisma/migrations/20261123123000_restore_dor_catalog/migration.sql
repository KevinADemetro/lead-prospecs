-- Restore Dor as a catalog entity selectable on leads.
CREATE TABLE "dores" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "dores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dores_name_key" ON "dores"("name");
CREATE INDEX "dores_deleted_at_created_at_idx" ON "dores"("deleted_at", "created_at");

-- Promote existing free-text values into catalog entries (name truncated to 80).
INSERT INTO "dores" ("id", "name", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), src."name", '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT LEFT(BTRIM("dor"), 80) AS "name"
    FROM "leads"
    WHERE "dor" IS NOT NULL AND BTRIM("dor") <> ''
) AS src
WHERE NOT EXISTS (
    SELECT 1 FROM "dores" d WHERE d."name" = src."name"
);

ALTER TABLE "leads" ADD COLUMN "dor_id" UUID;

UPDATE "leads" AS l
SET "dor_id" = d."id"
FROM "dores" AS d
WHERE l."dor" IS NOT NULL
  AND LEFT(BTRIM(l."dor"), 80) = d."name";

ALTER TABLE "leads" DROP COLUMN "dor";

CREATE INDEX "leads_dor_id_idx" ON "leads"("dor_id");

ALTER TABLE "leads"
ADD CONSTRAINT "leads_dor_id_fkey"
FOREIGN KEY ("dor_id") REFERENCES "dores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
