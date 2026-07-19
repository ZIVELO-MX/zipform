import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const spec = readFileSync(resolve(import.meta.dirname, "../../../docs/api/openapi.yaml"), "utf8");

function schemaBlock(name: string) {
  const match = spec.match(new RegExp(`^    ${name}:([\\s\\S]*?)(?=^    [A-Z][A-Za-z]+:)`, "m"));
  if (!match) throw new Error(`OpenAPI schema ${name} was not found`);
  return match[1];
}

describe("OpenAPI list responses", () => {
  it.each([
    "UserListResponse",
    "ProjectListResponse",
    "MissionListResponse",
    "QuestItemListResponse",
    "ResourceListResponse",
  ])("documents the deployed nextCursor shape for %s", (schema) => {
    const block = schemaBlock(schema);

    expect(block).toContain("required: [data, nextCursor]");
    expect(block).toContain("nextCursor:");
    expect(block).not.toContain("page:");
  });
});

describe("OpenAPI mission defaults and detail", () => {
  it("documents optional stable mission defaults", () => {
    const operation = spec.match(/^  \/missions:\n([\s\S]*?)(?=^  \/missions\/query:)/m)?.[1] ?? "";
    expect(operation).toContain("required: [title, type]");
    expect(operation).toContain("default: later");
    expect(operation).toContain("Defaults to the Zibot user ID");
    expect(operation).toContain("slug is zivelo");
  });

  it("documents checklist aggregates in MissionDetail", () => {
    const block = schemaBlock("MissionDetail");
    expect(block).toContain("checklistCount:");
    expect(block).toContain("completed:");
  });
});

describe("OpenAPI resource icons", () => {
  it("documents icon input and persisted resource output", () => {
    expect(schemaBlock("ResourceInput")).toContain("icon:");
    expect(schemaBlock("Resource")).toContain("icon:");
    expect(spec).toContain('$ref: "#/components/schemas/ResourceInput"');
  });
});

describe("OpenAPI mission attachments", () => {
  it("documents the two-phase direct upload contract and limits", () => {
    expect(spec).toContain("/missions/{missionId}/attachments:");
    expect(spec).toContain("operationId: prepareMissionAttachmentBatch");
    expect(spec).toContain("operationId: finalizeMissionAttachmentBatch");
    expect(spec).toContain("operationId: listMissionAttachmentGroups");
    expect(spec).toContain("maximum: 6291456");
    expect(spec).toContain("maxItems: 20");
    expect(spec).toContain("batch_superseded");
    expect(spec).toContain("sourceRevision");
  });
});
