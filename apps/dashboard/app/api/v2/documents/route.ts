import {
  dataClient,
  parseTlozDocumentMarkdown,
  TlozDocumentError,
  validateDocumentProperties,
  validateProjectFields,
} from "@tloz/data";
import type {
  TlozDocumentKind,
  TlozDocumentScalar,
  TlozDocumentUpdate,
  TlozFieldDefinition,
} from "@tloz/types";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../../lib/api-auth";
import { authorizeApiOperation } from "../../../../lib/authorization";
import { documentResponse, errorResponse, handleDocumentError } from "../../../../lib/document-api";

const DOCUMENT_KINDS = new Set<TlozDocumentKind>(["project", "mission", "inventory"]);

type CreateDocumentInput = {
  kind: TlozDocumentKind;
  parentPublicId?: string;
  title: string;
  summary: string;
  body: string;
  properties: Record<string, TlozDocumentScalar>;
  contract?: TlozFieldDefinition[];
};

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const kindValue = request.nextUrl.searchParams.get("type");
  if (kindValue && !DOCUMENT_KINDS.has(kindValue as TlozDocumentKind)) {
    return errorResponse("INVALID_REQUEST", "type debe ser project, mission o inventory.", 400);
  }
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "25");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return errorResponse("INVALID_REQUEST", "limit debe ser un entero entre 1 y 100.", 400);
  }

  try {
    const result = await dataClient.documents.find({
      kind: kindValue as TlozDocumentKind | undefined,
      projectId: request.nextUrl.searchParams.get("parent") ?? undefined,
      query: request.nextUrl.searchParams.get("q") ?? undefined,
    }, {
      limit,
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleDocumentError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const input = await readCreateInput(request);
    const requestedOwnerId = stringProperty(input.properties, input.kind === "project" ? "owner" : "assignee")
      ?? auth.user.id;
    const forbidden = authorizeApiOperation(auth.user, "create", { requestedOwnerId });
    if (forbidden) return forbidden;

    let documentId: string;
    if (input.kind === "project") {
      validateDocumentProperties([], input.properties, "project");
      if (input.contract) validateProjectFields(input.contract);
      const project = await dataClient.tloz.createProject({
        name: input.title,
        description: input.summary,
        descriptionDetail: input.body,
        icon: stringProperty(input.properties, "icon") ?? "FolderKanban",
        color: stringProperty(input.properties, "color") ?? "#6B6B6B",
        status: "active",
        type: "normal",
        ownerId: requestedOwnerId,
        startDate: stringProperty(input.properties, "start") ?? new Date().toISOString().slice(0, 10),
        dueDate: nullableStringProperty(input.properties, "due"),
      });
      documentId = `project-${project.slug}`;
    } else if (input.kind === "mission") {
      const parent = input.parentPublicId
        ? await dataClient.documents.get(input.parentPublicId)
        : null;
      if (!parent || parent.kind !== "project" || parent.publicId === "project-inventory" || !parent.source) {
        throw new TlozDocumentError("DOCUMENT_INVALID", "parent debe identificar un Project de Missions.", {
          parent: "invalid",
        });
      }
      const status = stringProperty(input.properties, "status")
        ?? contractDefault(parent.contract?.fields, "status")
        ?? "later";
      const category = stringProperty(input.properties, "category")
        ?? contractDefault(parent.contract?.fields, "category")
        ?? "side_quest";
      validateDocumentProperties(
        parent.contract?.fields ?? [],
        { ...input.properties, status, category },
        "mission",
      );
      const mission = await dataClient.tloz.createMission({
        title: input.title,
        description: input.summary,
        descriptionDetail: input.body,
        icon: stringProperty(input.properties, "icon") ?? "Sword",
        type: category as Parameters<typeof dataClient.tloz.createMission>[0]["type"],
        status: status as Parameters<typeof dataClient.tloz.createMission>[0]["status"],
        ownerId: requestedOwnerId,
        projectId: parent.source.id,
        startDate: nullableStringProperty(input.properties, "start"),
        dueDate: nullableStringProperty(input.properties, "due"),
        progress: numberProperty(input.properties, "progress") ?? 0,
      });
      documentId = mission.displayId;
    } else {
      if (input.parentPublicId && input.parentPublicId !== "project-inventory") {
        throw new TlozDocumentError("DOCUMENT_INVALID", "Inventory solo puede pertenecer a project-inventory.", {
          parent: "invalid",
        });
      }
      const inventoryProject = await dataClient.documents.get("project-inventory");
      const status = stringProperty(input.properties, "status")
        ?? contractDefault(inventoryProject?.contract?.fields, "status")
        ?? "locked";
      const category = stringProperty(input.properties, "category")
        ?? contractDefault(inventoryProject?.contract?.fields, "category")
        ?? "other";
      validateDocumentProperties(
        inventoryProject?.contract?.fields ?? [],
        { ...input.properties, status, category },
        "inventory",
      );
      const item = await dataClient.tloz.createQuestItem({
        name: input.title,
        description: input.summary,
        descriptionDetail: input.body,
        icon: stringProperty(input.properties, "icon") ?? "PackageOpen",
        status: status as Parameters<typeof dataClient.tloz.createQuestItem>[0]["status"],
        category: category as Parameters<typeof dataClient.tloz.createQuestItem>[0]["category"],
        ownerId: requestedOwnerId,
        acquiredAt: nullableStringProperty(input.properties, "acquired"),
      });
      documentId = item.id;
    }

    let document = await dataClient.documents.get(documentId);
    if (!document) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", "No se pudo resolver el documento creado.");
    if (input.kind === "project" && input.contract) {
      document = await dataClient.documents.replaceProjectContract(
        document.id,
        input.contract,
        document.revision,
      );
    }
    if (input.kind !== "project" && Object.keys(input.properties).length) {
      document = await dataClient.documents.update(
        document.id,
        { properties: input.properties },
        document.revision,
      );
    }
    const response = documentResponse(request, document);
    response.headers.set("Location", `/api/v2/documents/${encodeURIComponent(document.publicId)}`);
    return new Response(response.body, {
      status: 201,
      headers: response.headers,
    });
  } catch (error) {
    return handleDocumentError(error);
  }
}

async function readCreateInput(request: Request): Promise<CreateDocumentInput> {
  if (request.headers.get("content-type")?.includes("text/markdown")) {
    const parsed = parseTlozDocumentMarkdown(await request.text());
    return {
      kind: parsed.kind,
      parentPublicId: parsed.parentPublicId,
      title: parsed.title,
      summary: "",
      body: parsed.body,
      properties: parsed.properties,
      contract: parsed.contract?.fields,
    };
  }

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    throw new TlozDocumentError("DOCUMENT_INVALID", "El cuerpo JSON no es válido.");
  }
  const kind = (raw.kind ?? raw.type) as TlozDocumentKind;
  if (!DOCUMENT_KINDS.has(kind)) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "kind debe ser project, mission o inventory.", {
      kind: "invalid",
    });
  }
  if (typeof raw.title !== "string" || !raw.title.trim()) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "title es obligatorio.", { title: "required" });
  }
  return {
    kind,
    parentPublicId: typeof (raw.parentPublicId ?? raw.parent) === "string"
      ? String(raw.parentPublicId ?? raw.parent)
      : undefined,
    title: raw.title.trim(),
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    body: typeof raw.body === "string" ? raw.body.trim() : "",
    properties: isProperties(raw.properties) ? raw.properties : {},
    contract: readContractFields(raw.contract),
  };
}

function readContractFields(value: unknown): TlozFieldDefinition[] | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "contract debe ser un objeto.");
  }
  const fields = (value as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "contract.fields debe ser una lista.", {
      "contract.fields": "required",
    });
  }
  return fields.map((field, index) => (
    field && typeof field === "object" && !Array.isArray(field)
      ? {
        ...field,
        id: typeof (field as { id?: unknown }).id === "string"
          ? (field as { id: string }).id
          : `imported-${index}`,
      } as TlozFieldDefinition
      : field as TlozFieldDefinition
  ));
}

function isProperties(value: unknown): value is Record<string, TlozDocumentScalar> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringProperty(properties: TlozDocumentUpdate["properties"], key: string) {
  const value = properties?.[key];
  return typeof value === "string" && value ? value : undefined;
}

function nullableStringProperty(properties: TlozDocumentUpdate["properties"], key: string) {
  const value = properties?.[key];
  return value === null || typeof value === "string" ? value ?? undefined : undefined;
}

function numberProperty(properties: TlozDocumentUpdate["properties"], key: string) {
  const value = properties?.[key];
  return typeof value === "number" ? value : undefined;
}

function contractDefault(fields: TlozFieldDefinition[] | undefined, key: string) {
  const field = fields?.find((candidate) => candidate.key === key);
  return typeof field?.defaultValue === "string"
    ? field.defaultValue
    : field?.options[0]?.value;
}
