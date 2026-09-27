import { describe, expect, it, vi } from "vitest";
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

  it("forwards collection filters and preserves the store sort order", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate({ containers: snapshot.containers, contents: [
      { ...snapshot.contents[0], id: "inventory-1", publicId: "L-1", presentation: "library", title: "Zulu", data: { ownerId: "owner-1", status: "active", acquiredAt: "2026-01-02" } },
      { ...snapshot.contents[0], id: "inventory-2", publicId: "L-2", presentation: "library", title: "Alpha", data: { ownerId: "owner-1", status: "active", acquiredAt: "2026-01-01" } },
    ] });
    const findContents = vi.spyOn(store, "findContents").mockResolvedValue({
      data: [
        { ...snapshot.contents[0], id: "inventory-1", publicId: "L-1", presentation: "library", title: "Zulu", data: { ownerId: "owner-1", status: "active", acquiredAt: "2026-01-02" } },
        { ...snapshot.contents[0], id: "inventory-2", publicId: "L-2", presentation: "library", title: "Alpha", data: { ownerId: "owner-1", status: "active", acquiredAt: "2026-01-01" } },
      ],
      nextCursor: null,
    });
    const repository = createContainerContentDocumentRepository(store);

    const result = await repository.find(
      { kind: "inventory", ownerId: "owner-1", excludedStatuses: ["completed"], sort: "title" },
      { limit: 10 },
    );

    expect(findContents).toHaveBeenCalledWith({
      containerId: undefined,
      presentation: "quest-item",
      ownerId: "owner-1",
      excludedStatuses: ["completed"],
      sort: "title",
    }, { limit: 11, cursor: undefined });
    expect(result.data.map((document) => document.title)).toEqual(["Zulu", "Alpha"]);
  });

  it("merges explicitly sorted containers and contents globally", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate({
      containers: [{
        ...snapshot.containers[0],
        title: "Zulu container",
        data: { ownerId: "user-1", dueDate: "2026-02-01" },
      }],
      contents: [
        {
          ...snapshot.contents[0],
          id: "mission-alpha",
          publicId: "TLO-0002",
          title: "Alpha content",
          data: { ownerId: "user-1", status: "next", due: "2026-01-01" },
        },
        {
          ...snapshot.contents[0],
          id: "mission-beta",
          publicId: "TLO-0003",
          title: "Beta content",
          data: { ownerId: "user-1", status: "next", due: "" },
        },
      ],
    });
    const repository = createContainerContentDocumentRepository(store);

    await expect(repository.find({ sort: "title" }))
      .resolves.toMatchObject({ data: [
        { id: "mission-alpha" },
        { id: "mission-beta" },
        { id: "project-1" },
      ] });
    await expect(repository.find({ sort: "due-date" }))
      .resolves.toMatchObject({ data: [
        { id: "mission-alpha" },
        { id: "project-1" },
        { id: "mission-beta" },
      ] });
  });
});
