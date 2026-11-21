-- AlterTable
ALTER TABLE "leads" DROP COLUMN "score",
DROP COLUMN "score_reasons",
DROP COLUMN "trello_status",
DROP COLUMN "trello_card_id",
DROP COLUMN "trello_card_url";

-- DropEnum
DROP TYPE "TrelloStatus";
