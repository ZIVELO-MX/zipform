-- Remove historical dependency rows that violate the project-scoped invariant.
-- Future writes are validated by the repository because SQL foreign keys cannot
-- express equality between the projectId values of two referenced mission rows.
DELETE FROM "tloz_mission_dependencies"
WHERE "id" IN (
  SELECT dependency."id"
  FROM "tloz_mission_dependencies" AS dependency
  JOIN "tloz_missions" AS mission ON mission."id" = dependency."missionId"
  JOIN "tloz_missions" AS required ON required."id" = dependency."dependsOnMissionId"
  WHERE mission."projectId" IS NULL
     OR required."projectId" IS NULL
     OR mission."projectId" <> required."projectId"
);
