import { Prisma, PrismaClient } from "@prisma/client";
import { assertContainerContentReconciled, readCutoverState } from "./cutover";

export const LEGACY_RETIREMENT_TABLES = [
  "tloz_document_relations",
  "tloz_field_values",
  "tloz_field_definitions",
  "tloz_inventory_documents",
  "tloz_mission_documents",
  "tloz_project_documents",
  "tloz_documents",
  "tloz_document_definitions",
] as const;

const REQUIRED_EVIDENCE_FLAGS = ["--confirm", "--legacy-traffic-zero", "--backup-verified"] as const;

export class LegacyRetirementError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LegacyRetirementError";
  }
}

export type RetirementOptions = {
  execute: boolean;
  confirm: true;
  legacyTrafficZero: true;
  backupVerified: true;
};

export function parseRetirementArgs(args: readonly string[]): RetirementOptions {
  const flags = new Set(args);
  const missing = REQUIRED_EVIDENCE_FLAGS.filter((flag) => !flags.has(flag));
  if (missing.length) {
    throw new LegacyRetirementError(
      "retirement_requires_evidence",
      "El retiro requiere confirmación, tráfico legacy en cero y backup verificado.",
      { missing },
    );
  }
  return {
    execute: flags.has("--execute"),
    confirm: true,
    legacyTrafficZero: true,
    backupVerified: true,
  };
}

export function retirementDropStatements(): string[] {
  return LEGACY_RETIREMENT_TABLES.map((table) => `DROP TABLE "${table}"`);
}

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

async function readLegacyTables(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<Array<{ table_name: string }>>(Prisma.sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (${Prisma.join([...LEGACY_RETIREMENT_TABLES])})
    ORDER BY table_name
  `);
  return rows.map((row) => row.table_name);
}

async function validateCutover(prisma: PrismaExecutor) {
  const state = await readCutoverState(prisma as PrismaClient);
  if (state.source !== "canonical" || !state.writesEnabled) {
    throw new LegacyRetirementError(
      "cutover_not_canonical",
      "El corte canónico debe estar habilitado y aceptar escrituras antes del retiro.",
      { state },
    );
  }
  const reconciliation = await assertContainerContentReconciled(prisma as PrismaClient);
  if (!reconciliation.matches) {
    throw new LegacyRetirementError(
      "reconciliation_failed",
      "La reconciliación Container/Content no coincide; el retiro fue abortado.",
      { reconciliation },
    );
  }
  return { state, reconciliation };
}

export async function retireLegacy(prisma: PrismaClient, execute: boolean) {
  if (!execute) {
    const validation = await validateCutover(prisma);
    return {
      ready: true,
      retired: false,
      ...validation,
      note: "Validación completada. Añade --execute dentro de una ventana aprobada para retirar las tablas.",
    };
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtext('zipform:tloz:legacy-retirement'))");
    const validation = await validateCutover(tx);
    const existing = await readLegacyTables(tx);
    if (!existing.length) {
      return { ready: true, retired: true, alreadyRetired: true, ...validation, tables: [] };
    }
    if (existing.length !== LEGACY_RETIREMENT_TABLES.length) {
      throw new LegacyRetirementError(
        "retirement_partial_state",
        "El almacenamiento legacy está en un estado parcial; no se ejecutó ningún DROP.",
        { existing, expected: [...LEGACY_RETIREMENT_TABLES] },
      );
    }
    for (const statement of retirementDropStatements()) {
      await tx.$executeRawUnsafe(statement);
    }
    const remaining = await readLegacyTables(tx);
    if (remaining.length) {
      throw new LegacyRetirementError(
        "retirement_incomplete",
        "No se retiraron todas las tablas legacy; la transacción fue revertida.",
        { remaining },
      );
    }
    return { ready: true, retired: true, alreadyRetired: false, ...validation, tables: [...LEGACY_RETIREMENT_TABLES] };
  }, { maxWait: 10_000, timeout: 120_000 });
}
