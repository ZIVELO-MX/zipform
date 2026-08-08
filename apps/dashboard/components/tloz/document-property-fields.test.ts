import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./document-property-fields.tsx", import.meta.url), "utf8");

describe("document property fields", () => {
  it("persists the current optimistic revision and retains the returned document", () => {
    expect(source).toContain("current.revision");
    expect(source).toContain("setCurrent(updated)");
    expect(source).toContain("onDocumentChange?.(updated)");
    expect(source).toContain("DOCUMENT_REVISION_CONFLICT");
  });

  it("derives presentation editors without enumerating custom field keys", () => {
    expect(source).toContain("presentationFieldDefinition(field)");
    expect(source).toContain('field.format === "person"');
    expect(source).toContain('field.format === "date"');
    expect(source).toContain('field.format === "number"');
    expect(source).toContain("isDocumentDetailValuePresent(value) || !readOnly");
  });

  it("keeps computed presentation values read-only", () => {
    expect(source).toContain('"mission_count"');
    expect(source).toContain('"publicId"');
    expect(source).toContain('"project"');
  });
});
