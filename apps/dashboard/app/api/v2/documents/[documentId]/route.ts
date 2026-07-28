import { dataClient, TlozDocumentError } from "@tloz/data";
import type { TlozDocumentScalar, TlozDocumentUpdate } from "@tloz/types";
import { authenticateRequest } from "../../../../../lib/api-auth";
import {
  authorizeDocumentOperation,
  documentResponse,
  errorResponse,
  handleDocumentError,
  parseExpectedRevision,
} from "../../../../../lib/document-api";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  if (!validReference(documentId)) return invalidReference();
  const url = new URL(request.url);
  const include = url.searchParams.get("include");
  if (include && include !== "children") {
    return errorResponse("INVALID_REQUEST", "include solo admite children.", 400);
  }
  const childLimit = Number(url.searchParams.get("childLimit") ?? "25");
  if (!Number.isInteger(childLimit) || childLimit < 1 || childLimit > 100) {
    return errorResponse("INVALID_REQUEST", "childLimit debe ser un entero entre 1 y 100.", 400);
  }

  try {
    const document = await dataClient.documents.get(documentId, {
      includeChildren: include === "children",
      childrenPagination: {
        limit: childLimit,
        cursor: url.searchParams.get("childCursor") ?? undefined,
      },
    });
    if (!document) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
    return documentResponse(request, document);
  } catch (error) {
    return handleDocumentError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  if (!validReference(documentId)) return invalidReference();
  const revision = parseExpectedRevision(request);
  if (revision instanceof Response) return revision;

  try {
    const current = await dataClient.documents.get(documentId);
    if (!current) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
    const forbidden = authorizeDocumentOperation(auth.user, current);
    if (forbidden) return forbidden;
    const input = await readUpdate(request);
    return documentResponse(request, await dataClient.documents.update(current.id, input, revision));
  } catch (error) {
    return handleDocumentError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  if (!validReference(documentId)) return invalidReference();
  const revision = parseExpectedRevision(request);
  if (revision instanceof Response) return revision;

  try {
    const current = await dataClient.documents.get(documentId);
    if (!current) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
    const forbidden = authorizeDocumentOperation(
      auth.user,
      current,
      current.kind === "mission" ? "delete-mission" : "structure",
    );
    if (forbidden) return forbidden;
    await dataClient.documents.delete(current.id, revision);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleDocumentError(error);
  }
}

async function readUpdate(request: Request): Promise<TlozDocumentUpdate> {
  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    throw new TlozDocumentError("DOCUMENT_INVALID", "El cuerpo JSON no es válido.");
  }
  const allowed = new Set(["title", "summary", "body", "properties"]);
  if (Object.keys(raw).some((key) => !allowed.has(key))) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "El cuerpo contiene campos no soportados.");
  }
  if (raw.title !== undefined && typeof raw.title !== "string") invalid("title");
  if (raw.summary !== undefined && typeof raw.summary !== "string") invalid("summary");
  if (raw.body !== undefined && typeof raw.body !== "string") invalid("body");
  if (raw.properties !== undefined && !isProperties(raw.properties)) invalid("properties");
  return raw as TlozDocumentUpdate;
}

function isProperties(value: unknown): value is Record<string, TlozDocumentScalar> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.values(value).every((item) => (
      item === null
      || typeof item === "string"
      || typeof item === "number"
      || typeof item === "boolean"
      || (Array.isArray(item) && item.every((entry) => typeof entry === "string"))
    ));
}

function invalid(field: string): never {
  throw new TlozDocumentError("DOCUMENT_INVALID", `${field} no es válido.`, { [field]: "invalid" });
}

function validReference(value: string) {
  return Boolean(value) && value.length <= 128;
}

function invalidReference() {
  return errorResponse("INVALID_REQUEST", "documentId inválido.", 400);
}
