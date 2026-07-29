import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const documentPage = readFileSync(new URL("./document-entity-page.tsx", import.meta.url), "utf8");
const renderer = readFileSync(new URL("./document-view-renderer.tsx", import.meta.url), "utf8");
const missionDetail = readFileSync(new URL("./mission-detail.tsx", import.meta.url), "utf8");
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
    expect(renderer).toContain("documentMutation={mutate}");
    expect(renderer).toContain("canUpdateDocument={detail.canUpdate}");
    expect(renderer).toContain("canMove={detail.canMove}");
    expect(renderer).toContain("updateDocument(");
    expect(renderer).not.toContain("DocumentRecordEditorDetail");
    expect(projectRoute).not.toContain("<SystemEntityDetailPage");
    expect(inventoryRoute).not.toContain("<SystemEntityDetailPage");
    expect(systemDetail).toContain("<DocumentDetail");
    expect(systemDetail).not.toContain("export function SystemEntityDetail");
  });

  it("keeps document content and properties on the shared mutation adapter", () => {
    expect(renderer).toContain("getDocumentDetailOptions(props.document.id)");
    expect(renderer).toContain("detail.document.revision");
    expect(renderer).toContain("onBackingDocumentChange");
    expect(missionPage).toContain("canMove={canMove}");
    expect(missionDetail).toContain('kind === "project" ? "owner" : "assignee"');
    expect(missionDetail).toContain("documentMutation({ body: nextMarkdown })");
    expect(missionDetail).toContain("isMissionDocument ? <><div");
  });

  it("shows an empty resources section for non-Mission documents", () => {
    expect(missionDetail).toContain('<RelationsSection className="mt-7" title="Recursos">');
    expect(missionDetail).toContain("<EmptyText>Sin recursos adjuntos.</EmptyText>");
    expect(missionDetail).toContain("<MissionResourceReferences resources={current.resources}");
    expect(missionDetail).toContain("onAddResource?: (input: TlozResourceInput)");
  });

  it("derives project and inventory checklists from document Markdown", () => {
    expect(renderer).toContain("parseMarkdownChecklist(document.body)");
    expect(renderer).toContain("checklistCount: checklist.length");
    expect(missionDetail).toContain('<AccordionItem value="checklist" className="border-0">');
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
