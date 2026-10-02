import { describe, expect, it } from "vitest";
import type { ContainerRecord } from "@tloz/types";
import { createJsonbPrototypeStore } from "./container-content-prototype";
import { validateContainerRecord } from "./container-content-store";

const timestamp = "2026-07-30T00:00:00.000Z";

const validDefinition = {
  fields: [{ key: "title", label: "Title", format: "text", required: true }],
  views: [{ id: "default", fields: ["title"] }],
  defaultView: "default",
};

type ContainerInput = Omit<ContainerRecord, "id" | "revision" | "createdAt" | "updatedAt"> & { id?: string };

function containerInput(definition: unknown): ContainerInput {
  return {
    publicId: "cnt-1",
    slug: "books",
    presentation: "library",
    title: "Books",
    summary: "Reading list",
    body: "",
    definition: definition as ContainerRecord["definition"],
    data: {},
  };
}

function containerRecord(definition: unknown): ContainerRecord {
  return { id: "container-1", revision: 1, createdAt: timestamp, updatedAt: timestamp, ...containerInput(definition) };
}

describe("validateContainerRecord definition contract", () => {
  it("accepts a well formed definition", () => {
    expect(() => validateContainerRecord(containerRecord(validDefinition))).not.toThrow();
  });

  it("rejects a definition whose fields are not a list of objects", () => {
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, fields: undefined })))
      .toThrow(/definition\.fields/);
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, fields: {} })))
      .toThrow(/definition\.fields/);
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, fields: [null] })))
      .toThrow(/definition\.fields/);
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, fields: ["title"] })))
      .toThrow(/definition\.fields/);
  });

  it("rejects a definition whose views are not a list of objects", () => {
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, views: undefined })))
      .toThrow(/definition\.views/);
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, views: {} })))
      .toThrow(/definition\.views/);
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, views: [null] })))
      .toThrow(/definition\.views/);
    expect(() => validateContainerRecord(containerRecord({ ...validDefinition, views: ["default"] })))
      .toThrow(/definition\.views/);
  });
});

describe("prototype store definition guard", () => {
  it("refuses to create a Container whose definition has no usable fields or views", async () => {
    const store = createJsonbPrototypeStore();
    await expect(
      store.createContainer(containerInput({ title: "missing" })),
    ).rejects.toMatchObject({ code: "STORE_INVALID" });
  });

  it("refuses to replace a Container definition with a malformed one", async () => {
    const store = createJsonbPrototypeStore();
    const created = await store.createContainer(containerInput(validDefinition));
    await expect(
      store.updateContainer(created.id, { definition: { fields: {}, views: [] } as never }, 1),
    ).rejects.toMatchObject({ code: "STORE_INVALID" });
  });

  it("still creates and updates a Container with a well formed definition", async () => {
    const store = createJsonbPrototypeStore();
    const created = await store.createContainer(containerInput(validDefinition));
    expect(created.revision).toBe(1);
    await expect(
      store.updateContainer(created.id, { summary: "Updated" }, 1),
    ).resolves.toMatchObject({ revision: 2, summary: "Updated" });
  });
});
