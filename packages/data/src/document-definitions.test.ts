import { describe, expect, it } from "vitest";
import { createDataClient } from "./index";

describe("document definitions and aggregates", () => {
  it("exposes persisted-shaped collection definitions including detail", async () => {
    const client = createDataClient("mock");

    const projects = await client.documents.getDefinition("projects");
    const inventory = await client.documents.getDefinition("inventory");

    expect(projects).toMatchObject({
      kind: "project",
      scope: "collection",
      defaultView: "table",
    });
    expect(projects?.views.map((view) => view.id)).toContain("detail");
    expect(inventory?.views.map((view) => view.id)).toEqual(["table", "list", "detail"]);
  });

  it("loads project children only when requested", async () => {
    const client = createDataClient("mock");
    const projects = await client.documents.find({ kind: "project" }, { limit: 100 });
    const project = projects.data.find((document) => Number(document.properties.mission_count) > 0);
    expect(project).toBeDefined();

    const plain = await client.documents.get(project!.id);
    const aggregate = await client.documents.get(project!.id, {
      includeChildren: true,
      childrenPagination: { limit: 1 },
    });

    expect(plain?.children).toBeUndefined();
    expect(aggregate?.children?.data).toHaveLength(1);
    expect(aggregate?.children?.total).toBe(project!.properties.mission_count);
  });

  it("hides technical projects and normalizes inventory as root documents", async () => {
    const client = createDataClient("mock");
    const projects = await client.documents.find({ kind: "project" }, { limit: 100 });
    const inventory = await client.documents.find({ kind: "inventory" }, { limit: 1 });

    expect(projects.data.map((document) => document.publicId)).not.toContain("project-inventory");
    expect(inventory.data[0]).toMatchObject({ kind: "inventory" });
    expect(inventory.data[0]?.parentId).toBeUndefined();
    expect(inventory.data[0]?.parentPublicId).toBeUndefined();
  });
});
