import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const documentPage = readFileSync(new URL("./document-entity-page.tsx", import.meta.url), "utf8");
const renderer = readFileSync(new URL("./document-view-renderer.tsx", import.meta.url), "utf8");
const projectRoute = readFileSync(new URL("../../app/projects/[projectSlug]/page.tsx", import.meta.url), "utf8");
const inventoryRoute = readFileSync(new URL("../../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");
const missionPage = readFileSync(new URL("./mission-detail-page.tsx", import.meta.url), "utf8");
const systemDetail = readFileSync(new URL("./system-project-detail.tsx", import.meta.url), "utf8");
const projectWorkspace = readFileSync(new URL("./project-workspace-page.tsx", import.meta.url), "utf8");
const collectionPage = readFileSync(new URL("./document-collection-page.tsx", import.meta.url), "utf8");

describe("document entity routes", () => {
  it("routes project and inventory documents through the agnostic detail view", () => {
    expect(projectRoute).toContain("<DocumentEntityPage");
    expect(inventoryRoute).toContain("<DocumentEntityPage");
    expect(documentPage).toContain("<DocumentEntityView");
    expect(missionPage).toContain("<DocumentDetail");
    expect(renderer).toContain("export function DocumentDetail");
    expect(renderer).toContain("function documentToDetailMission");
    expect(renderer).toContain("<MissionDetail");
    expect(renderer).toContain("resolveDocumentDetailPropertyProjection");
    expect(renderer).toContain("presentationFields: props.definition.fields");
    expect(renderer).not.toContain("DocumentRecordEditorDetail");
    expect(projectRoute).not.toContain("<SystemEntityDetailPage");
    expect(inventoryRoute).not.toContain("<SystemEntityDetailPage");
    expect(systemDetail).toContain("<DocumentDetail");
    expect(systemDetail).not.toContain("export function SystemEntityDetail");
  });

  it("canonicalizes aliases to public document identifiers", () => {
    expect(documentPage).toContain("permanentRedirect(");
    expect(documentPage).toContain("resolvedDocument.publicId");
  });

  it("renders project missions through the document collection filtered by parent", () => {
    expect(projectWorkspace).toContain('getTlozDocuments("mission", projectDocument.id)');
    expect(projectWorkspace).toContain("<DocumentViewRenderer");
  });

  it("uses Mission list and table UI without a duplicate document toolbar", () => {
    expect(renderer).toContain("<MissionList");
    expect(renderer).toContain("<MissionTable");
    expect(renderer).toContain('<TlozViewHeader');
    expect(renderer).toContain('Todas las missions · agrupadas por estado');
    expect(renderer).toContain('Todas las missions · todas las propiedades');
    expect(renderer).not.toContain("DocumentCollectionToolbar");
    expect(collectionPage).toContain('(["list", "table"] satisfies TlozView[])');
  });
});
