CREATE TABLE "tloz_domain_cutover" (
    "key" TEXT NOT NULL DEFAULT 'domain',
    "source" TEXT NOT NULL DEFAULT 'legacy',
    "writesEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "reason" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tloz_domain_cutover_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "tloz_domain_cutover_singleton" CHECK ("key" = 'domain'),
    CONSTRAINT "tloz_domain_cutover_source" CHECK ("source" IN ('legacy', 'canonical')),
    CONSTRAINT "tloz_domain_cutover_version_positive" CHECK ("version" > 0)
);

INSERT INTO "tloz_domain_cutover" ("key", "source", "writesEnabled", "reason", "version")
VALUES ('domain', 'legacy', TRUE, 'TLO-0080 safe default until explicit enable', 1)
ON CONFLICT ("key") DO NOTHING;
