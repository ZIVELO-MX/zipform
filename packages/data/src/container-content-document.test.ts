import { describe, expect, it } from "vitest";
import { createJsonbPrototypeStore } from "./container-content-prototype";
import { createContainerContentDocumentRepository } from "./container-content-document";

const now = "2026-01-01T00:00:00.000Z";
const snapshot = {
  containers: [{
    id: "project-1", publicId: "project-core", slug: "core", presentation: "project", title: "Core", summary: "Summary", body: "",
    definition: { fields: [{ key: "status", label: "Status", format: "select", required: true, visible: true }], views: [{ id: "list", fields: ["title"] }], defaultView: "list" },
    data: { ownerId: "user-1" }, revision: 1, createdAt: now, updatedAt: now,
  }],
  contents: [{
    id: "mission-1", publicId: "TLO-0001", containerId: "project-1", presentation: "mission", title: "Mission", summary: "", body: "# Body",
    data: { ownerId: "user-1", status: "next" }, revision: 1, createdAt: now, updatedAt: now,
  }],
};

describe("Container/Content document adapter", () => {
  it("projects canonical records to the temporary document compatibility shape", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(snapshot);
    const repository = createContainerContentDocumentRepository(store);
    await expect(repository.get("TLO-0001")).resolves.toMatchObject({
      id: "mission-1", publicId: "TLO-0001", kind: "mission", parentId: "project-1", properties: { ownerId: "user-1", status: "next" },
    });
    await expect(repository.getDefinition("project:project-1:children")).resolves.toMatchObject({ kind: "mission", scope: "children" });
  });

  it("writes updates through Content and increments its revision", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(snapshot);
    const repository = createContainerContentDocumentRepository(store);
    await expect(repository.update("mission-1", { title: "Updated", properties: { status: "completed" } }, 1)).resolves.toMatchObject({ title: "Updated", revision: 2, properties: { status: "completed" } });
  });
});
