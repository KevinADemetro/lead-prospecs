-- AlterTable
ALTER TABLE "companies" DROP COLUMN "google_rating",
DROP COLUMN "google_review_count";

-- Remove dead rating keys from campaign filters JSON
UPDATE "campaigns"
SET "filters" = "filters" - 'minRating' - 'minReviewCount'
WHERE "filters" ?| array['minRating', 'minReviewCount'];
