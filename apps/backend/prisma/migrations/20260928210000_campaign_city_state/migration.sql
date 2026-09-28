-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "state" VARCHAR(2) NOT NULL DEFAULT '';
