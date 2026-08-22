-- Deliberately non-destructive marker. Prisma deployments must never retire
-- production tables implicitly. The guarded CLI validates evidence and runs
-- the ordered DROP statements in one explicit transaction.
SELECT 1;
