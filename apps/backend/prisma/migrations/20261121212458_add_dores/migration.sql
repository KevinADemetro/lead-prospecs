-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "dores_name_key" ON "dores"("name");

-- CreateIndex
CREATE INDEX "dores_deleted_at_created_at_idx" ON "dores"("deleted_at", "created_at");

-- AlterTable
ALTER TABLE "leads" ADD COLUMN "dor_id" UUID;

-- CreateIndex
CREATE INDEX "leads_dor_id_idx" ON "leads"("dor_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_dor_id_fkey" FOREIGN KEY ("dor_id") REFERENCES "dores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
