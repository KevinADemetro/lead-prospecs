-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "facebook_url" TEXT;

-- WebsiteStatus: ONLINE -> FOUND, OFFLINE -> UNAVAILABLE, new ERROR
CREATE TYPE "WebsiteStatus_new" AS ENUM ('FOUND', 'NOT_FOUND', 'UNAVAILABLE', 'ERROR', 'UNKNOWN');
ALTER TABLE "leads" ALTER COLUMN "website_status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "website_status" TYPE "WebsiteStatus_new" USING (
  CASE "website_status"::text
    WHEN 'ONLINE' THEN 'FOUND'
    WHEN 'OFFLINE' THEN 'UNAVAILABLE'
    ELSE "website_status"::text
  END
)::"WebsiteStatus_new";
DROP TYPE "WebsiteStatus";
ALTER TYPE "WebsiteStatus_new" RENAME TO "WebsiteStatus";
ALTER TABLE "leads" ALTER COLUMN "website_status" SET DEFAULT 'UNKNOWN';

-- WhatsappStatus: dedicated enum (FOUND -> CONFIRMED)
CREATE TYPE "WhatsappStatus" AS ENUM ('CONFIRMED', 'NOT_FOUND', 'UNKNOWN');
ALTER TABLE "leads" ALTER COLUMN "whatsapp_status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "whatsapp_status" TYPE "WhatsappStatus" USING (
  CASE "whatsapp_status"::text
    WHEN 'FOUND' THEN 'CONFIRMED'
    ELSE "whatsapp_status"::text
  END
)::"WhatsappStatus";
ALTER TABLE "leads" ALTER COLUMN "whatsapp_status" SET DEFAULT 'UNKNOWN';

-- TrelloStatus: SENT -> CREATED, FAILED -> ERROR, PENDING -> NOT_SENT
CREATE TYPE "TrelloStatus_new" AS ENUM ('NOT_SENT', 'CREATED', 'ERROR');
ALTER TABLE "leads" ALTER COLUMN "trello_status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "trello_status" TYPE "TrelloStatus_new" USING (
  CASE "trello_status"::text
    WHEN 'SENT' THEN 'CREATED'
    WHEN 'FAILED' THEN 'ERROR'
    WHEN 'PENDING' THEN 'NOT_SENT'
    ELSE "trello_status"::text
  END
)::"TrelloStatus_new";
DROP TYPE "TrelloStatus";
ALTER TYPE "TrelloStatus_new" RENAME TO "TrelloStatus";
ALTER TABLE "leads" ALTER COLUMN "trello_status" SET DEFAULT 'NOT_SENT';
