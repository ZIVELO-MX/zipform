import { describe, expect, it, vi } from "vitest";
import { createCutoverDocumentRepository } from "./cutover-document-repository";
import { TlozDocumentError } from "./document-errors";

const repository = () => ({
  find: vi.fn(async () => ({ data: [], nextCursor: null })),
  get: vi.fn(async () => null),
  getDefinition: vi.fn(async () => null),
  update: vi.fn(),
  replaceProjectContract: vi.fn(),
  delete: vi.fn(),
});

function prismaWith(state: { source: "legacy" | "canonical"; writesEnabled: boolean }) {
  return { tlozDomainCutover: { findUnique: vi.fn(async () => ({ key: "domain", ...state, reason: "test", version: 1, updatedAt: new Date() })) } } as never;
}

describe("cutover document repository", () => {
  it("routes reads and writes to the selected source", async () => {
    const legacy = repository();
    const canonical = repository();
    const proxy = createCutoverDocumentRepository(prismaWith({ source: "canonical", writesEnabled: true }), legacy, canonical);
    await proxy.find({});
    await proxy.update("id", { title: "updated" }, 1);
    expect(canonical.find).toHaveBeenCalled();
    expect(canonical.update).toHaveBeenCalled();
    expect(legacy.find).not.toHaveBeenCalled();
  });

  it("blocks writes during the read-only window", async () => {
    const proxy = createCutoverDocumentRepository(prismaWith({ source: "legacy", writesEnabled: false }), repository(), repository());
    await expect(proxy.delete("id", 1)).rejects.toMatchObject({ code: "DOCUMENT_CUTOVER_READ_ONLY" } satisfies Partial<TlozDocumentError>);
  });
});
