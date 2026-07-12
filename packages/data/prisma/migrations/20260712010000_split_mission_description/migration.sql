ALTER TABLE "tloz_missions" ADD COLUMN "descriptionDetail" TEXT NOT NULL DEFAULT '';

UPDATE "tloz_missions"
SET "descriptionDetail" = "description",
    "description" = COALESCE("conclusion", '');

ALTER TABLE "tloz_missions" DROP COLUMN "conclusion";
