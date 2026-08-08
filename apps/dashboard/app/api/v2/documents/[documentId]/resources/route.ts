import { dataClient, TlozDocumentError } from "@tloz/data";
import type { TlozResourceInput } from "@tloz/data";
import type { TlozResourceType } from "@tloz/types";
import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import {
  authorizeDocumentOperation,
  handleDocumentError,
} from "../../../../../../lib/document-api";

const RESOURCE_TYPES = new Set<TlozResourceType>(["link", "document", "image", "file", "note"]);
type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  try {
    const document = await requiredSourceDocument(documentId);
    const resources = await resourcesFor(document);
    return NextResponse.json({ data: resources });
  } catch (error) {
    return handleDocumentError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  try {
    const document = await requiredSourceDocument(documentId);
    const forbidden = authorizeDocumentOperation(auth.user, document);
    if (forbidden) return forbidden;
    const input = await readResource(request);
    if (document.kind === "mission") {
      await dataClient.tloz.addMissionResource(document.source!.id, input);
    } else if (document.kind === "project") {
      await dataClient.tloz.addProjectResource(document.source!.id, input);
    } else {
      await dataClient.tloz.addQuestItemResource(document.source!.id, input);
    }
    const resources = await resourcesFor(document);
    return NextResponse.json({ data: resources.at(-1) }, { status: 201 });
  } catch (error) {
    return handleDocumentError(error);
  }
}

async function readResource(request: Request): Promise<TlozResourceInput> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    throw new TlozDocumentError("DOCUMENT_INVALID", "El cuerpo JSON no es válido.");
  }
  if (typeof body.type !== "string" || !RESOURCE_TYPES.has(body.type as TlozResourceType)) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "type de recurso no es válido.", {
      type: "invalid",
    });
  }
  if (typeof body.title !== "string" || !body.title.trim()) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "title es obligatorio.", {
      title: "required",
    });
  }
  return {
    type: body.type as TlozResourceType,
    title: body.title.trim(),
    ...(typeof body.url === "string" ? { url: body.url } : {}),
    ...(typeof body.fileId === "string" ? { fileId: body.fileId } : {}),
    ...(typeof body.icon === "string" ? { icon: body.icon } : {}),
  };
}

async function requiredSourceDocument(documentId: string) {
  const document = await dataClient.canonicalDocuments.get(documentId);
  if (!document) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
  if (!document.source) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "El documento no admite recursos durante la compatibilidad v1.");
  }
  return document;
}

async function resourcesFor(document: Awaited<ReturnType<typeof requiredSourceDocument>>) {
  const filters = document.kind === "mission"
    ? { missionId: document.source!.id }
    : document.kind === "project"
      ? { projectId: document.source!.id }
      : { questItemId: document.source!.id };
  return (await dataClient.tloz.findResources(filters, { limit: 100 })).data;
}
