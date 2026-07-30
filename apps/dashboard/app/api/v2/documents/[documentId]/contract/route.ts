import { dataClient, TlozDocumentError } from "@tloz/data";
import type { TlozFieldDefinition } from "@tloz/types";
import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import {
  authorizeDocumentOperation,
  documentResponse,
  handleDocumentError,
  parseExpectedRevision,
  revisionEtag,
} from "../../../../../../lib/document-api";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  try {
    const project = await requiredProject(documentId);
    return NextResponse.json({ data: project.contract }, {
      headers: { ETag: revisionEtag(project.revision), "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return handleDocumentError(error);
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  const revision = parseExpectedRevision(request);
  if (revision instanceof Response) return revision;
  try {
    const project = await requiredProject(documentId);
    const forbidden = authorizeDocumentOperation(auth.user, project, "structure");
    if (forbidden) return forbidden;
    let body: { fields?: TlozFieldDefinition[] };
    try {
      body = await request.json();
    } catch {
      throw new TlozDocumentError("DOCUMENT_INVALID", "El cuerpo JSON no es válido.");
    }
    if (!Array.isArray(body.fields)) {
      throw new TlozDocumentError("DOCUMENT_INVALID", "fields es obligatorio.", {
        fields: "required",
      });
    }
    return documentResponse(
      request,
      await dataClient.canonicalDocuments.replaceProjectContract(project.id, body.fields, revision),
    );
  } catch (error) {
    return handleDocumentError(error);
  }
}

async function requiredProject(documentId: string) {
  const document = await dataClient.canonicalDocuments.get(documentId);
  if (!document) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
  if (document.kind !== "project" || !document.contract) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "El documento no es un Project.");
  }
  return document;
}
