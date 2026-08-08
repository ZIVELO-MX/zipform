import { describe, expect, it } from "vitest";
import {
  checksumSnapshot,
  ContainerContentError,
  type ContainerContentSnapshot,
  type ContainerContentStore,
  createJsonbPrototypeStore,
  createMongoPrototypeStore,
} from "./container-content-prototype";

const timestamp = "2026-07-30T00:00:00.000Z";

const snapshot: ContainerContentSnapshot = {
  containers: [
    {
      id: "container-inventory",
      publicId: "inventory",
      slug: "inventory",
      presentation: "inventory",
      title: "Inventory",
      summary: "",
      body: "",
      definition: {
        fields: [{ key: "status", label: "Estado", format: "status", visible: true }],
        views: [{ id: "table", fields: ["title", "status"] }],
        defaultView: "table",
      },
      data: {},
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "container-project-tloz",
      publicId: "project-tloz",
      slug: "tloz",
      presentation: "project",
      title: "TLOZ",
      summary: "Proyecto operativo",
      body: "# TLOZ",
      definition: {
        fields: [
          { key: "status", label: "Estado", format: "status", required: true, visible: true },
          { key: "internalNote", label: "Nota", format: "text", visible: false },
        ],
        views: [{ id: "board", fields: ["title", "status"], groupBy: "status" }],
        defaultView: "board",
      },
      data: { ownerId: "user-zibot", color: "#d72228" },
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  contents: [
    {
      id: "content-inventory-token",
      publicId: "INV-0001",
      containerId: "container-inventory",
      presentation: "inventory-item",
      title: "API token",
      summary: "Referencia reutilizable",
      body: "",
      data: { status: "unlocked", expiresAt: null },
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "content-library-adr",
      publicId: "LIB-0001",
      containerId: "container-project-tloz",
      presentation: "resource",
      title: "ADR compartido",
      summary: "",
      body: "# ADR",
      data: {},
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "content-mission-75",
      publicId: "TLO-0075",
      containerId: "container-project-tloz",
      presentation: "mission",
      title: "Decidir persistencia",
      summary: "Comparar stores",
      body: "## Criterios\n\n- [ ] Comparar",
      data: {
        status: "now",
        customPriority: "nuclear",
        internalNote: "Se conserva aunque la UI lo oculte.",
        optionalValue: null,
        checklist: [{ id: "check-1", title: "Comparar", completed: false }],
        relations: [
          {
            contentId: "content-inventory-token",
            relation: "uses_inventory",
            required: true,
          },
        ],
        resources: [
          {
            id: "resource-adr",
            type: "link",
            title: "ADR",
            url: "https://example.test/adr",
          },
        ],
      },
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
};

const factories = [
  ["Supabase JSONB", createJsonbPrototypeStore],
  ["MongoDB BSON", createMongoPrototypeStore],
] as const;

describe.each(factories)("%s Container/Content prototype", (_, createStore) => {
  it("migrates idempotently and preserves the canonical checksum", async () => {
    const store = createStore();
    const first = await store.migrate(snapshot);
    const second = await store.migrate(snapshot);

    expect(first).toEqual({
      inserted: 5,
      updated: 0,
      unchanged: 0,
      checksum: checksumSnapshot(snapshot),
    });
    expect(second).toEqual({
      inserted: 0,
      updated: 0,
      unchanged: 5,
      checksum: first.checksum,
    });
    expect(await store.exportSnapshot()).toEqual(snapshot);
  });

  it("queries by container, presentation, and variable data", async () => {
    const store = await migrated(createStore());

    await expect(store.listContents({
      containerId: "container-project-tloz",
      presentation: "mission",
      data: { status: "now" },
    })).resolves.toEqual([
      expect.objectContaining({ publicId: "TLO-0075", presentation: "mission" }),
    ]);
  });

  it("rejects a cursor that is not part of the requested collection", async () => {
    const store = await migrated(createStore());

    await expect(store.findContainers({}, { cursor: "missing" }))
      .rejects.toMatchObject({ name: "PaginationCursorError", cursor: "missing" });
    await expect(store.findContents({}, { cursor: "missing" }))
      .rejects.toMatchObject({ name: "PaginationCursorError", cursor: "missing" });
  });

  it("updates with revisions while preserving hidden, null, and custom fields", async () => {
    const store = await migrated(createStore());
    const updated = await store.updateContent(
      "content-mission-75",
      {
        title: "  Persistencia elegida  ",
        data: { status: "completed" },
      },
      1,
    );

    expect(updated).toMatchObject({
      title: "Persistencia elegida",
      revision: 2,
      data: {
        status: "completed",
        customPriority: "nuclear",
        internalNote: "Se conserva aunque la UI lo oculte.",
        optionalValue: null,
        checklist: [{ id: "check-1", title: "Comparar", completed: false }],
        resources: [expect.objectContaining({ id: "resource-adr" })],
      },
    });
    await expect(store.updateContent(
      "content-mission-75",
      { title: "Stale" },
      1,
    )).rejects.toMatchObject({ code: "STORE_REVISION_CONFLICT" });
  });

  it("fails fast for invalid input, references, missing records, and outages", async () => {
    const store = await migrated(createStore());

    await expect(store.updateContent(
      "content-mission-75",
      { title: " " },
      1,
    )).rejects.toMatchObject({ code: "STORE_INVALID", fields: { title: "required" } });
    await expect(store.updateContent(
      "content-mission-75",
      {
        data: {
          relations: [{ contentId: "missing-content", relation: "depends_on" }],
        },
      },
      1,
    )).rejects.toMatchObject({
      code: "STORE_REFERENCE_INVALID",
      fields: { relations: "not_found" },
    });
    await expect(store.updateContent("missing-content", { title: "Missing" }, 1))
      .rejects.toMatchObject({ code: "STORE_NOT_FOUND" });

    store.setAvailable(false);
    await expect(store.getContent("content-mission-75"))
      .rejects.toEqual(expect.objectContaining({
        name: "ContainerContentError",
        code: "STORE_UNAVAILABLE",
      }));
  });

  it("restores a verified snapshot after a failed cutover", async () => {
    const store = await migrated(createStore());
    const before = await store.exportSnapshot();
    const checksumBefore = checksumSnapshot(before);

    await store.updateContent(
      "content-mission-75",
      { data: { status: "completed" } },
      1,
    );
    expect(checksumSnapshot(await store.exportSnapshot())).not.toBe(checksumBefore);

    await store.restoreSnapshot(before);
    expect(checksumSnapshot(await store.exportSnapshot())).toBe(checksumBefore);
  });
});

describe("Container/Content cross-store conformance", () => {
  it("exports the same canonical state from both physical representations", async () => {
    const jsonb = await migrated(createJsonbPrototypeStore());
    const mongo = await migrated(createMongoPrototypeStore());

    expect(await jsonb.exportSnapshot()).toEqual(await mongo.exportSnapshot());
    expect(checksumSnapshot(await jsonb.exportSnapshot()))
      .toBe(checksumSnapshot(await mongo.exportSnapshot()));
  });

  it("rejects duplicate identities and dangling containers before writing", async () => {
    const duplicate = structuredClone(snapshot);
    duplicate.contents[1].id = duplicate.contents[0].id;
    await expect(createJsonbPrototypeStore().migrate(duplicate))
      .rejects.toBeInstanceOf(ContainerContentError);

    const dangling = structuredClone(snapshot);
    dangling.contents[0].containerId = "container-missing";
    await expect(createMongoPrototypeStore().migrate(dangling))
      .rejects.toMatchObject({
        code: "STORE_REFERENCE_INVALID",
        fields: { containerId: "not_found" },
      });
  });
});

async function migrated(store: ContainerContentStore) {
  await store.migrate(snapshot);
  return store;
}
