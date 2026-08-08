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

  it("uses project and inventory detail semantics for Workshop and Library", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate({
      containers: [
        { ...snapshot.containers[0], id: "workshop-1", publicId: "workshop", slug: "workshop", presentation: "workshop", title: "Workshop" },
        { ...snapshot.containers[0], id: "library-1", publicId: "library", slug: "library", presentation: "library", title: "Library" },
      ],
      contents: [
        { ...snapshot.contents[0], id: "content-workshop", publicId: "W-1", containerId: "workshop-1", presentation: "workshop", data: { ownerId: "user-1", startDate: "2026-01-01", dueDate: "2026-02-01" } },
        { ...snapshot.contents[0], id: "content-library", publicId: "L-1", containerId: "library-1", presentation: "library", data: { ownerId: "user-1", acquiredAt: "2026-03-01" } },
      ],
    });
    const repository = createContainerContentDocumentRepository(store);
    await expect(repository.get("W-1")).resolves.toMatchObject({ kind: "project", properties: { owner: "user-1", start: "2026-01-01", due: "2026-02-01" } });
    await expect(repository.get("L-1")).resolves.toMatchObject({ kind: "inventory", properties: { assignee: "user-1", acquired: "2026-03-01" } });
  });
});
