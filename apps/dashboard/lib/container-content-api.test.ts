import { createDataClient, type ContainerContentStore } from "@tloz/data";
import type { ContainerRecord } from "@tloz/types";
import { describe, expect, it } from "vitest";
import { handleContainerContentError } from "./container-content-api";

const validDefinition = {
  fields: [{ key: "title", label: "Title", format: "text" }],
  views: [{ id: "default", fields: ["title"] }],
  defaultView: "default",
};

function store(): ContainerContentStore {
  return createDataClient("mock").containerContent;
}

function containerInput(overrides: Partial<ContainerRecord> = {}) {
  return {
    publicId: "cnt-1",
    slug: "books",
    presentation: "library",
    title: "Books",
    summary: "",
    body: "",
    definition: validDefinition as ContainerRecord["definition"],
    data: {},
    ...overrides,
  };
}

describe("handleContainerContentError", () => {
  it("maps a rejected store write to 400", async () => {
    const rejection = await store().createContainer({ ...containerInput(), title: "   " }).catch((error) => error);

    expect(handleContainerContentError(rejection).status).toBe(400);
  });

  it("maps a missing container to 404", async () => {
    const rejection = await store().updateContainer("missing", { title: "Renamed" }, 1).catch((error) => error);

    expect(handleContainerContentError(rejection).status).toBe(404);
  });

  it("maps a stale revision to 409", async () => {
    const client = store();
    const created = await client.createContainer(containerInput());
    const rejection = await client.updateContainer(created.id, { title: "Renamed" }, 99).catch((error) => error);

    expect(handleContainerContentError(rejection).status).toBe(409);
  });

  it("keeps unexpected failures at 500", () => {
    expect(handleContainerContentError(new Error("boom")).status).toBe(500);
  });
});
