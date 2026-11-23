-- Convert Dor from a catalog entity to free-text on leads.
ALTER TABLE "leads" ADD COLUMN "dor" TEXT;

UPDATE "leads" AS l
SET "dor" = d."name"
FROM "dores" AS d
WHERE l."dor_id" = d."id"
  AND d."deleted_at" IS NULL
  AND NULLIF(BTRIM(d."name"), '') IS NOT NULL;

ALTER TABLE "leads" DROP CONSTRAINT "leads_dor_id_fkey";
DROP INDEX "leads_dor_id_idx";
ALTER TABLE "leads" DROP COLUMN "dor_id";

DROP TABLE "dores";

-- Drop obsolete catalog permissions from role arrays.
UPDATE "roles"
SET "permissions" = COALESCE(
  (
    SELECT ARRAY_AGG(p ORDER BY ord)
    FROM unnest("permissions") WITH ORDINALITY AS t(p, ord)
    WHERE p NOT IN ('dores.read', 'dores.create', 'dores.update', 'dores.delete')
  ),
  ARRAY[]::TEXT[]
);
