-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('UNKNOWN', 'NOT_FOUND', 'ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('UNKNOWN', 'NOT_FOUND', 'FOUND');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('PENDING', 'QUALIFIED', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "TrelloStatus" AS ENUM ('NOT_SENT', 'PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL,
    "categories" TEXT[],
    "search_terms" TEXT[],
    "filters" JSONB NOT NULL DEFAULT '{}',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "cnpj" VARCHAR(14),
    "category" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "google_place_id" TEXT,
    "google_maps_url" TEXT,
    "google_rating" DOUBLE PRECISION,
    "google_review_count" INTEGER,
    "dedupe_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "website_status" "WebsiteStatus" NOT NULL DEFAULT 'UNKNOWN',
    "whatsapp_status" "PresenceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "instagram_status" "PresenceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "facebook_status" "PresenceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "score" INTEGER,
    "score_reasons" TEXT[],
    "qualification_status" "QualificationStatus" NOT NULL DEFAULT 'PENDING',
    "trello_status" "TrelloStatus" NOT NULL DEFAULT 'NOT_SENT',
    "trello_card_id" TEXT,
    "trello_card_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_status_created_at_idx" ON "campaigns"("status", "created_at");

-- CreateIndex
CREATE INDEX "campaigns_deleted_at_created_at_idx" ON "campaigns"("deleted_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "companies_google_place_id_key" ON "companies"("google_place_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_dedupe_key_key" ON "companies"("dedupe_key");

-- CreateIndex
CREATE INDEX "companies_deleted_at_created_at_idx" ON "companies"("deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "leads_company_id_idx" ON "leads"("company_id");

-- CreateIndex
CREATE INDEX "leads_campaign_id_qualification_status_idx" ON "leads"("campaign_id", "qualification_status");

-- CreateIndex
CREATE INDEX "leads_deleted_at_created_at_idx" ON "leads"("deleted_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_campaign_id_company_id_key" ON "leads"("campaign_id", "company_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
