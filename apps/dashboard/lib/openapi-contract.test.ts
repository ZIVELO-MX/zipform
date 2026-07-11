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
