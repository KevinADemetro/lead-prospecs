-- AlterTable
ALTER TABLE "leads" DROP COLUMN "whatsapp_status",
DROP COLUMN "instagram_status",
DROP COLUMN "facebook_status";

-- DropEnum
DROP TYPE "WhatsappStatus";
DROP TYPE "PresenceStatus";
