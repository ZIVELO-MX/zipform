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

const interleavedSnapshot = {
  containers: [
    { ...snapshot.containers[0], id: "container-a", publicId: "project-a", slug: "a", updatedAt: "2026-01-05T00:00:00.000Z" },
    { ...snapshot.containers[0], id: "container-b", publicId: "project-b", slug: "b", updatedAt: "2026-01-02T00:00:00.000Z" },
    { ...snapshot.containers[0], id: "container-c", publicId: "project-c", slug: "c", updatedAt: "2025-12-30T00:00:00.000Z" },
  ],
  contents: [
    { ...snapshot.contents[0], id: "content-1", publicId: "TLO-0101", containerId: "container-a", updatedAt: "2026-01-04T00:00:00.000Z" },
    { ...snapshot.contents[0], id: "content-2", publicId: "TLO-0102", containerId: "container-a", updatedAt: "2026-01-03T00:00:00.000Z" },
    { ...snapshot.contents[0], id: "content-3", publicId: "TLO-0103", containerId: "container-b", updatedAt: "2026-01-01T00:00:00.000Z" },
    { ...snapshot.contents[0], id: "content-4", publicId: "TLO-0104", containerId: "container-b", updatedAt: "2025-12-31T00:00:00.000Z" },
  ],
};

async function collectPages(
  read: (cursor?: string) => Promise<{ data: Array<{ id: string }>; nextCursor: string | null }>,
) {
  const ids: string[] = [];
  const cursors: string[] = [];
  let cursor: string | undefined;
  for (let guard = 0; guard < 20; guard += 1) {
    const page = await read(cursor);
    ids.push(...page.data.map((item) => item.id));
    if (!page.nextCursor) return { ids, cursors };
    if (cursors.includes(page.nextCursor)) throw new Error(`cursor ${page.nextCursor} repeated`);
    cursors.push(page.nextCursor);
    cursor = page.nextCursor;
  }
  throw new Error("pagination did not terminate");
}

describe("Container/Content document pagination", () => {
  it("walks a mixed Containers and Contents collection without dropping or repeating documents", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const { ids, cursors } = await collectPages((cursor) => repository.find({}, { limit: 2, cursor }));

    expect(ids).toEqual([
      "container-a", "content-1", "content-2", "container-b",
      "content-3", "content-4", "container-c",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cursors).toHaveLength(3);
    expect(cursors.every((cursor) => cursor.startsWith("m:"))).toBe(true);
  });

  it("keeps each source position when a page only shows one source", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const first = await repository.find({}, { limit: 2 });
    expect(first.data.map((item) => item.id)).toEqual(["container-a", "content-1"]);

    const second = await repository.find({}, { limit: 2, cursor: first.nextCursor! });
    expect(second.data.map((item) => item.id)).toEqual(["content-2", "container-b"]);
    expect(second.nextCursor).toBe('m:{"containers":"container-b","contents":"content-2"}');

    const third = await repository.find({}, { limit: 2, cursor: second.nextCursor! });
    expect(third.data.map((item) => item.id)).toEqual(["content-3", "content-4"]);
    expect(third.nextCursor).toBe('m:{"containers":"container-b","contents":"content-4"}');

    const fourth = await repository.find({}, { limit: 2, cursor: third.nextCursor! });
    expect(fourth.data.map((item) => item.id)).toEqual(["container-c"]);
    expect(fourth.nextCursor).toBeNull();
  });

  it("still pages a single-source collection with a plain record cursor", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const first = await repository.find({ kind: "mission" }, { limit: 3 });
    expect(first.data.map((item) => item.id)).toEqual(["content-1", "content-2", "content-3"]);
    expect(first.nextCursor).toBe("content-3");

    const second = await repository.find({ kind: "mission" }, { limit: 3, cursor: first.nextCursor! });
    expect(second.data.map((item) => item.id)).toEqual(["content-4"]);
    expect(second.nextCursor).toBeNull();
  });

  it("scopes parent queries to the container's own contents", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const page = await repository.find({ parentId: "container-b" }, { limit: 10 });
    expect(page.data.map((item) => item.id)).toEqual(["content-3", "content-4"]);
    expect(page.nextCursor).toBeNull();
  });

  it("keeps paging a mixed query whose only match sits beyond the first batch", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const first = await repository.find({ query: "TLO-0104" }, { limit: 1 });
    expect(first.data).toEqual([]);
    expect(first.nextCursor).toBe('m:{"containers":"container-b","contents":"content-2"}');

    const { ids } = await collectPages((cursor) =>
      repository.find({ query: "TLO-0104" }, { limit: 1, cursor }));

    expect(ids).toEqual(["content-4"]);
  });

  it("keeps paging a single-source query whose only match sits beyond the first batch", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const { ids } = await collectPages((cursor) =>
      repository.find({ kind: "mission", query: "TLO-0104" }, { limit: 1, cursor }));

    expect(ids).toEqual(["content-4"]);
  });

  it("returns every query match once across single-source pages", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const { ids } = await collectPages((cursor) =>
      repository.find({ kind: "mission", query: "TLO-0" }, { limit: 1, cursor }));

    expect(ids).toEqual(["content-1", "content-2", "content-3", "content-4"]);
  });

  it("returns every mixed query match once when only containers match", async () => {
    const store = createJsonbPrototypeStore();
    await store.migrate(interleavedSnapshot);
    const repository = createContainerContentDocumentRepository(store);

    const { ids, cursors } = await collectPages((cursor) =>
      repository.find({ query: "project-" }, { limit: 1, cursor }));

    expect(ids).toEqual(["container-a", "container-b", "container-c"]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cursors.every((cursor) => cursor.startsWith("m:"))).toBe(true);
  });
});
