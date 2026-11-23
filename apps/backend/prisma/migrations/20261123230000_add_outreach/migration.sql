-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('WAITING_REPLY', 'IN_CONVERSATION', 'PROPOSAL_DECLINED', 'NO_REPLY');

-- CreateEnum
CREATE TYPE "OutreachMessageStep" AS ENUM ('INITIAL', 'FOLLOW_UP_D3', 'FOLLOW_UP_D7', 'FOLLOW_UP_D14');

-- CreateTable
CREATE TABLE "outreach" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'WAITING_REPLY',
    "started_at" TIMESTAMP(3) NOT NULL,
    "next_follow_up_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "outreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_messages" (
    "id" UUID NOT NULL,
    "outreach_id" UUID NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "step" "OutreachMessageStep" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outreach_lead_id_key" ON "outreach"("lead_id");

-- CreateIndex
CREATE INDEX "outreach_status_next_follow_up_at_idx" ON "outreach"("status", "next_follow_up_at");

-- CreateIndex
CREATE INDEX "outreach_deleted_at_created_at_idx" ON "outreach"("deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "outreach_messages_outreach_id_sent_at_idx" ON "outreach_messages"("outreach_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_messages_outreach_id_step_key" ON "outreach_messages"("outreach_id", "step");

-- AddForeignKey
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_outreach_id_fkey" FOREIGN KEY ("outreach_id") REFERENCES "outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
