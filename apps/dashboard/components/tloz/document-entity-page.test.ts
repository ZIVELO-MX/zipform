import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const documentPage = readFileSync(new URL("./document-entity-page.tsx", import.meta.url), "utf8");
const renderer = readFileSync(new URL("./document-view-renderer.tsx", import.meta.url), "utf8");
const projectRoute = readFileSync(new URL("../../app/projects/[projectSlug]/page.tsx", import.meta.url), "utf8");
const inventoryRoute = readFileSync(new URL("../../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");

describe("document entity routes", () => {
  it("routes project and inventory documents through the agnostic detail view", () => {
    expect(projectRoute).toContain("<DocumentEntityPage");
    expect(inventoryRoute).toContain("<DocumentEntityPage");
    expect(documentPage).toContain("<DocumentEntityView");
    expect(renderer).toContain('view.id === "detail"');
    expect(projectRoute).not.toContain("<SystemEntityDetailPage");
    expect(inventoryRoute).not.toContain("<SystemEntityDetailPage");
  });

  it("canonicalizes aliases to public document identifiers", () => {
    expect(documentPage).toContain("permanentRedirect(");
    expect(documentPage).toContain("resolvedDocument.publicId");
  });
});
