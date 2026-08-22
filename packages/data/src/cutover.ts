import type { PrismaClient } from "@prisma/client";
import { reconcileContainerContent } from "./container-content-backfill";

export type CutoverSource = "legacy" | "canonical";
export type CutoverOperation = "read" | "write" | "write_blocked";
export type CutoverState = {
  source: CutoverSource;
  writesEnabled: boolean;
  reason: string;
  version: number;
  updatedAt: string;
};

const KEY = "domain";
const fallback: CutoverState = {
  source: "canonical",
  writesEnabled: true,
  reason: "cutover control table is not installed; preserve the v2 canonical default",
  version: 0,
  updatedAt: new Date(0).toISOString(),
};

function tableMissing(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2021";
}

export async function readCutoverState(prisma: PrismaClient): Promise<CutoverState> {
  try {
    const row = await prisma.tlozDomainCutover.findUnique({ where: { key: KEY } });
    if (!row) return fallback;
    return { source: row.source as CutoverSource, writesEnabled: row.writesEnabled, reason: row.reason, version: row.version, updatedAt: row.updatedAt.toISOString() };
  } catch (error) {
    if (tableMissing(error)) return fallback;
    throw error;
  }
}

export async function setCutoverState(
  prisma: PrismaClient,
  input: { source: CutoverSource; writesEnabled: boolean; reason: string; updatedBy?: string },
  expectedVersion?: number,
) {
  const current = await readCutoverState(prisma);
  if (current.version > 0 && expectedVersion !== undefined && current.version !== expectedVersion) {
    throw new Error(`cutover version conflict: expected ${expectedVersion}, got ${current.version}`);
  }
  const nextVersion = current.version + 1;
  const row = await prisma.tlozDomainCutover.upsert({
    where: { key: KEY },
    create: { key: KEY, ...input, version: nextVersion },
    update: { ...input, version: nextVersion },
  });
  return { source: row.source as CutoverSource, writesEnabled: row.writesEnabled, reason: row.reason, version: row.version, updatedAt: row.updatedAt.toISOString() };
}

export async function assertContainerContentReconciled(prisma: PrismaClient) {
  const result = await reconcileContainerContent(prisma);
  if (!result.matches) throw new Error("legacy and canonical Container/Content data are not reconciled");
  return result;
}

export async function recordCutoverObservation(
  prisma: PrismaClient,
  source: CutoverSource,
  operation: CutoverOperation,
  observedAt = new Date(),
) {
  const bucket = new Date(`${observedAt.toISOString().slice(0, 10)}T00:00:00.000Z`);
  try {
    await prisma.tlozDomainCutoverObservation.upsert({
      where: { bucket_source_operation: { bucket, source, operation } },
      create: { bucket, source, operation, count: 1, lastAt: observedAt },
      update: { count: { increment: 1 }, lastAt: observedAt },
    });
  } catch (error) {
    if (!tableMissing(error)) throw error;
  }
}

export async function listCutoverObservations(prisma: PrismaClient, days = 7) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - Math.max(1, days) + 1);
  since.setUTCHours(0, 0, 0, 0);
  try {
    const rows = await prisma.tlozDomainCutoverObservation.findMany({
      where: { bucket: { gte: since } },
      orderBy: [{ bucket: "asc" }, { source: "asc" }, { operation: "asc" }],
    });
    return rows.map((row) => ({ ...row, bucket: row.bucket.toISOString().slice(0, 10), count: Number(row.count), lastAt: row.lastAt.toISOString() }));
  } catch (error) {
    if (tableMissing(error)) return [];
    throw error;
  }
}

export async function listCutoverObservationsSince(prisma: PrismaClient, since: Date) {
  try {
    const rows = await prisma.tlozDomainCutoverObservation.findMany({
      where: { lastAt: { gte: since } },
      orderBy: [{ lastAt: "asc" }, { source: "asc" }, { operation: "asc" }],
    });
    return rows.map((row) => ({ ...row, bucket: row.bucket.toISOString().slice(0, 10), count: Number(row.count), lastAt: row.lastAt.toISOString() }));
  } catch (error) {
    if (tableMissing(error)) return [];
    throw error;
  }
}
