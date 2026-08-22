import type { PrismaClient } from "@prisma/client";
import type { TlozDocumentRepository } from "./contracts";
import { TlozDocumentError } from "./document-errors";
import { readCutoverState, recordCutoverObservation, type CutoverOperation } from "./cutover";

export function createCutoverDocumentRepository(prisma: PrismaClient, legacy: TlozDocumentRepository, canonical: TlozDocumentRepository): TlozDocumentRepository {
  async function target(operation: CutoverOperation) {
    const state = await readCutoverState(prisma);
    await recordCutoverObservation(prisma, state.source, operation);
    return { state, repository: state.source === "canonical" ? canonical : legacy };
  }
  async function writable() {
    const state = await readCutoverState(prisma);
    await recordCutoverObservation(prisma, state.source, state.writesEnabled ? "write" : "write_blocked");
    if (!state.writesEnabled) throw new TlozDocumentError("DOCUMENT_CUTOVER_READ_ONLY", "El dominio está en ventana de corte de solo lectura.");
    const result = { state, repository: state.source === "canonical" ? canonical : legacy };
    return result.repository;
  }
  return {
    find: async (...args) => (await target("read")).repository.find(...args),
    get: async (...args) => (await target("read")).repository.get(...args),
    getDefinition: async (...args) => (await target("read")).repository.getDefinition(...args),
    update: async (...args) => (await writable()).update(...args),
    replaceProjectContract: async (...args) => (await writable()).replaceProjectContract(...args),
    delete: async (...args) => (await writable()).delete(...args),
  };
}
