-- QualificationStatus: add AUTO_QUALIFIED for system / bulk approval
CREATE TYPE "QualificationStatus_new" AS ENUM ('PENDING', 'QUALIFIED', 'DISQUALIFIED', 'AUTO_QUALIFIED');
ALTER TABLE "leads" ALTER COLUMN "qualification_status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "qualification_status" TYPE "QualificationStatus_new" USING (
  "qualification_status"::text::"QualificationStatus_new"
);
DROP TYPE "QualificationStatus";
ALTER TYPE "QualificationStatus_new" RENAME TO "QualificationStatus";
ALTER TABLE "leads" ALTER COLUMN "qualification_status" SET DEFAULT 'PENDING';
