import {
  dataClient,
  parseTlozDocumentMarkdown,
  TlozDocumentError,
  validateDocumentProperties,
  validateProjectFields,
} from "@tloz/data";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import {
  authorizeDocumentOperation,
  documentResponse,
  handleDocumentError,
  parseExpectedRevision,
} from "../../../../../../lib/document-api";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId } = await params;
  try {
    const document = await dataClient.documents.get(documentId);
    if (!document) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
    const markdownRequest = new Request(request.url, {
      headers: new Headers({ ...Object.fromEntries(request.headers), Accept: "text/markdown" }),
    });
    return documentResponse(markdownRequest, document);
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
    const current = await dataClient.documents.get(documentId);
    if (!current) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
    const forbidden = authorizeDocumentOperation(auth.user, current);
    if (forbidden) return forbidden;
    const markdown = request.headers.get("content-type")?.includes("text/markdown")
      ? await request.text()
      : await markdownFromJson(request);
    const parsed = parseTlozDocumentMarkdown(markdown);
    if (
      parsed.publicId !== current.publicId
      || parsed.kind !== current.kind
      || parsed.parentPublicId !== current.parentPublicId
    ) {
      throw new TlozDocumentError(
        "DOCUMENT_INVALID",
        "id, type y parent no pueden cambiar mediante el documento.",
      );
    }
    validateDocumentProperties(
      current.kind === "project"
        ? []
        : (await dataClient.documents.get(current.parentId ?? ""))?.contract?.fields ?? [],
      parsed.properties,
      current.kind,
    );
    if (parsed.contract) validateProjectFields(parsed.contract.fields);
    let nextRevision = revision;
    if (parsed.contract) {
      await dataClient.documents.replaceProjectContract(current.id, parsed.contract.fields, nextRevision);
      nextRevision += 1;
    }
    const updated = await dataClient.documents.update(current.id, {
      title: parsed.title,
      body: parsed.body,
      properties: parsed.properties,
    }, nextRevision);
    return documentResponse(request, updated);
  } catch (error) {
    return handleDocumentError(error);
  }
}

async function markdownFromJson(request: Request) {
  let body: { markdown?: unknown };
  try {
    body = await request.json();
  } catch {
    throw new TlozDocumentError("DOCUMENT_INVALID", "El cuerpo JSON no es válido.");
  }
  if (typeof body.markdown !== "string") {
    throw new TlozDocumentError("DOCUMENT_INVALID", "markdown es obligatorio.", {
      markdown: "required",
    });
  }
  return body.markdown;
}
