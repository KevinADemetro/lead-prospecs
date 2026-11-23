-- AlterTable
ALTER TABLE "leads" ADD COLUMN "priority" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "leads"("priority");
