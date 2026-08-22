CREATE TABLE "tloz_domain_cutover_observations" (
  "bucket" DATE NOT NULL,
  "source" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "count" BIGINT NOT NULL DEFAULT 0,
  "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tloz_domain_cutover_observations_pkey"
    PRIMARY KEY ("bucket", "source", "operation"),
  CONSTRAINT "tloz_domain_cutover_observations_source"
    CHECK ("source" IN ('legacy', 'canonical')),
  CONSTRAINT "tloz_domain_cutover_observations_operation"
    CHECK ("operation" IN ('read', 'write', 'write_blocked'))
);

CREATE INDEX "tloz_domain_cutover_observations_source_bucket_idx"
  ON "tloz_domain_cutover_observations"("source", "bucket");
