import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

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
    expect(operation).toContain("Defaults to the authenticated developer");
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

describe("OpenAPI authorization errors", () => {
  it("documents a 403 response beside every authenticated operation", () => {
    const unauthorized = spec.match(/components\/responses\/Unauthorized/g) ?? [];
    const forbidden = spec.match(/components\/responses\/Forbidden/g) ?? [];
    expect(forbidden).toHaveLength(unauthorized.length);
    expect(spec).toContain("Forbidden:");
    expect(spec).toContain("not permitted to perform this operation");
  });

  it("documents sanitized reader user profiles", () => {
    const user = schemaBlock("User");
    expect(user).toContain("Email is omitted for agent:reader");
    expect(user).toContain("required: [id, name, username, role, type, avatarUrl]");
    expect(user).not.toContain("required: [id, name, username, email");
  });
});

describe("OpenAPI document v2 contract", () => {
  it("documents JSON and Markdown representations with optimistic concurrency", () => {
    expect(spec).toContain("title: TLOZ Data API");
    expect(spec).toContain("/documents/{documentId}/document:");
    expect(spec).toContain("operationId: importDocument");
    expect(spec).toContain("text/markdown:");
    expect(spec).toContain("name: If-Match");
    expect(spec).toContain('"409":');
    expect(spec).toContain('"428":');
  });

  it("documents project contracts and the shared document kinds", () => {
    expect(spec).toContain("operationId: replaceProjectContract");
    expect(spec).toContain("operationId: deleteDocumentResource");
    expect(schemaBlock("DocumentKind")).toContain("enum: [project, mission, inventory]");
    expect(schemaBlock("DocumentCreate")).toContain("contract:");
    expect(schemaBlock("FieldDefinition")).toContain("enum: [text, number, boolean, date, select, multiselect, person, relation]");
    expect(schemaBlock("FieldOption")).toContain("enum: [backlog, ready, active, blocked, done]");
  });
});

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

const SPEC_METHODS = HTTP_METHODS.map((method) => method.toLowerCase() as Lowercase<HttpMethod>);

type SpecPathItem = { servers?: { url: string }[] } & Partial<Record<Lowercase<HttpMethod>, unknown>>;

type SpecDocument = { servers?: { url: string }[]; paths?: Record<string, SpecPathItem> };

const apiRoot = resolve(import.meta.dirname, "../app/api");

// Routes owned by Next.js itself: they are not part of the TLOZ Data API contract.
const ROUTES_OUTSIDE_THE_CONTRACT = new Set(["GET /auth/{}", "GET /openapi"]);

function normalisePath(path: string) {
  return path.replace(/\{[^}]+\}/g, "{}");
}

function routeFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...routeFiles(path));
    else if (entry.name === "route.ts") files.push(path);
  }
  return files;
}

function routeOperations() {
  const operations = new Set<string>();
  for (const file of routeFiles(apiRoot)) {
    const segments = relative(apiRoot, dirname(file)).split(sep).filter(Boolean);
    const path = `/${segments.map((segment) => (segment.startsWith("[") ? "{}" : segment)).join("/")}`;
    const source = readFileSync(file, "utf8");
    for (const method of HTTP_METHODS) {
      if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(source)) {
        operations.add(`${method} ${path}`);
      }
    }
  }
  return operations;
}

function documentedOperations() {
  const document = parse(spec) as SpecDocument;
  const rootServer = document.servers?.[0]?.url;
  if (!rootServer) throw new Error("The OpenAPI spec declares no server URL");

  const operations = new Set<string>();
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    const pathUrl = `${item.servers?.[0]?.url ?? rootServer}${path}`;
    if (!pathUrl.startsWith("/api/")) {
      throw new Error(`OpenAPI path ${path} resolves to ${pathUrl}, which is outside /api`);
    }
    const routePath = normalisePath(pathUrl.slice("/api".length));
    for (const method of SPEC_METHODS) {
      if (item[method]) operations.add(`${method.toUpperCase()} ${routePath}`);
    }
  }
  return operations;
}

describe("OpenAPI route coverage", () => {
  const documented = documentedOperations();
  const routed = routeOperations();

  it("documents every Data API route handler", () => {
    const undocumented = [...routed]
      .filter((operation) => !documented.has(operation) && !ROUTES_OUTSIDE_THE_CONTRACT.has(operation))
      .sort();

    expect(undocumented).toEqual([]);
  });

  it("documents no operation that has no route handler", () => {
    const phantom = [...documented].filter((operation) => !routed.has(operation)).sort();

    expect(phantom).toEqual([]);
  });
});
