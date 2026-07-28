import { describe, expect, it } from "vitest";
import type { TlozDocument } from "@tloz/types";
import { parseTlozDocumentMarkdown, serializeTlozDocumentMarkdown } from "./document-markdown";

const mission: TlozDocument = {
  id: "8ac9504c-9a51-4ec7-9dd7-4c241047b94d",
  publicId: "TLO-0023",
  kind: "mission",
  parentId: "c6907817-4bd1-48bf-bb5a-fb7ec036267d",
  parentPublicId: "project-tloz",
  projectSlug: "tloz",
  title: "Mejorar el pipeline de previews",
  summary: "Un preview por rama.",
  body: "## Alcance\n\nCrear un único preview.\n\n## Criterios de aceptación\n\n- [ ] Publicar capturas.",
  revision: 2,
  properties: {
    status: "in-progress",
    priority: "high",
    assignee: "execution-agent",
    branch: "mission-023",
    pr: null,
  },
  source: { type: "mission", id: "legacy-23" },
  createdAt: "2026-07-27T00:00:00.000Z",
  updatedAt: "2026-07-27T00:00:00.000Z",
};

describe("TLOZ Markdown documents", () => {
  it("serializes the public Markdown contract without exposing internal UUIDs", () => {
    const markdown = serializeTlozDocumentMarkdown(mission);

    expect(markdown).toContain("id: TLO-0023");
    expect(markdown).toContain("type: mission");
    expect(markdown).toContain("parent: project-tloz");
    expect(markdown).toContain("# Mejorar el pipeline de previews");
    expect(markdown).not.toContain(mission.id);
    expect(markdown).toContain("pr: null");
  });

  it("round-trips mission frontmatter, title and body", () => {
    const parsed = parseTlozDocumentMarkdown(serializeTlozDocumentMarkdown(mission));

    expect(parsed).toEqual({
      publicId: mission.publicId,
      kind: mission.kind,
      parentPublicId: mission.parentPublicId,
      title: mission.title,
      body: mission.body,
      properties: {
        status: "in-progress",
        priority: "high",
        assignee: "execution-agent",
        branch: "mission-023",
        pr: null,
      },
      contract: undefined,
    });
  });

  it("serializes and parses a project field contract", () => {
    const project: TlozDocument = {
      ...mission,
      publicId: "project-tloz",
      kind: "project",
      parentId: undefined,
      parentPublicId: undefined,
      title: "TLOZ",
      properties: {},
      contract: {
        projectId: "project-tloz",
        fields: [{
          id: "status",
          key: "status",
          label: "Estado",
          type: "select",
          required: true,
          visible: true,
          position: 0,
          defaultValue: "later",
          options: [
            { value: "later", label: "Later", role: "backlog" },
            { value: "now", label: "Now", role: "active" },
          ],
        }],
      },
    };

    const parsed = parseTlozDocumentMarkdown(serializeTlozDocumentMarkdown(project));
    expect(parsed.contract?.fields).toEqual([
      expect.objectContaining({
        key: "status",
        type: "select",
        required: true,
        defaultValue: "later",
        options: [
          { value: "later", label: "Later", role: "backlog" },
          { value: "now", label: "Now", role: "active" },
        ],
      }),
    ]);
  });

  it("rejects missing frontmatter, parent and canonical H1", () => {
    expect(() => parseTlozDocumentMarkdown("# Missing frontmatter")).toThrow("frontmatter");
    expect(() => parseTlozDocumentMarkdown("---\nid: TLO-0001\ntype: mission\n---\n# Mission")).toThrow("parent");
    expect(() => parseTlozDocumentMarkdown("---\nid: project-core\ntype: project\n---\nBody")).toThrow("H1");
  });
});
