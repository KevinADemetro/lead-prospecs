-- Rename Dor catalog to PainPoint (English domain naming).

ALTER TABLE "dores" RENAME TO "pain_points";
ALTER INDEX "dores_pkey" RENAME TO "pain_points_pkey";
ALTER INDEX "dores_name_key" RENAME TO "pain_points_name_key";
ALTER INDEX "dores_deleted_at_created_at_idx" RENAME TO "pain_points_deleted_at_created_at_idx";

ALTER TABLE "leads" DROP CONSTRAINT "leads_dor_id_fkey";
DROP INDEX "leads_dor_id_idx";
ALTER TABLE "leads" RENAME COLUMN "dor_id" TO "pain_point_id";
CREATE INDEX "leads_pain_point_id_idx" ON "leads"("pain_point_id");
ALTER TABLE "leads"
ADD CONSTRAINT "leads_pain_point_id_fkey"
FOREIGN KEY ("pain_point_id") REFERENCES "pain_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate role permission strings dores.* → pain-points.*
UPDATE "roles"
SET "permissions" = ARRAY(
  SELECT CASE
    WHEN p = 'dores.read' THEN 'pain-points.read'
    WHEN p = 'dores.create' THEN 'pain-points.create'
    WHEN p = 'dores.update' THEN 'pain-points.update'
    WHEN p = 'dores.delete' THEN 'pain-points.delete'
    ELSE p
  END
  FROM unnest("permissions") AS p
)
WHERE "permissions" && ARRAY['dores.read', 'dores.create', 'dores.update', 'dores.delete'];
