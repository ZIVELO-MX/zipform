import type { PrismaClient } from "@prisma/client";
import type { TlozDocumentRepository } from "./contracts";
import { TlozDocumentError } from "./document-errors";
import { readCutoverState } from "./cutover";

export function createCutoverDocumentRepository(prisma: PrismaClient, legacy: TlozDocumentRepository, canonical: TlozDocumentRepository): TlozDocumentRepository {
  async function target() {
    const state = await readCutoverState(prisma);
    return { state, repository: state.source === "canonical" ? canonical : legacy };
  }
  async function writable() {
    const result = await target();
    if (!result.state.writesEnabled) throw new TlozDocumentError("DOCUMENT_CUTOVER_READ_ONLY", "El dominio está en ventana de corte de solo lectura.");
    return result.repository;
  }
  return {
    find: async (...args) => (await target()).repository.find(...args),
    get: async (...args) => (await target()).repository.get(...args),
    getDefinition: async (...args) => (await target()).repository.getDefinition(...args),
    update: async (...args) => (await writable()).update(...args),
    replaceProjectContract: async (...args) => (await writable()).replaceProjectContract(...args),
    delete: async (...args) => (await writable()).delete(...args),
  };
}
