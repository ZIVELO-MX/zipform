import {
  serializeTlozDocumentMarkdown,
  TlozDocumentError,
} from "@tloz/data";
import type { TlozDocument } from "@tloz/types";
import { NextResponse } from "next/server";
import { authorizeApiOperation, type TlozOperation } from "./authorization";
import { errorResponse, parseExpectedRevision as parseRevision, revisionEtag } from "./api-response";

export { errorResponse, revisionEtag } from "./api-response";

type Actor = { id: string; type: string; role: string };

export function documentResponse(request: Request, document: TlozDocument) {
  const url = new URL(request.url);
  const wantsMarkdown = url.searchParams.get("format") === "markdown"
    || request.headers.get("accept")?.includes("text/markdown");
  const headers = {
    ETag: revisionEtag(document.revision),
    "Cache-Control": "private, no-store",
    Vary: "Accept",
    Deprecation: "true",
    Sunset: "2026-10-31T00:00:00Z",
    Link: "</api/v2/containers>; rel=\"successor-version\", </api/v2/contents>; rel=\"successor-version\"",
  };
  if (wantsMarkdown) {
    return new Response(serializeTlozDocumentMarkdown(document), {
      headers: {
        ...headers,
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }
  return NextResponse.json({ data: document }, { headers });
}

export function parseExpectedRevision(request: Request): number | Response {
  return parseRevision(request, "If-Match con la revisión vigente es obligatorio.");
}

export function authorizeDocumentOperation(
  actor: Actor,
  document: TlozDocument,
  operation: TlozOperation = "update",
) {
  const ownerId = stringProperty(document, document.kind === "project" ? "owner" : "assignee");
  return authorizeApiOperation(actor, operation, { ownerId });
}

export function handleDocumentError(error: unknown) {
  if (error instanceof TlozDocumentError) {
    const status = error.code === "DOCUMENT_NOT_FOUND"
      ? 404
      : error.code === "DOCUMENT_REVISION_CONFLICT"
        ? 409
        : error.code === "DOCUMENT_CUTOVER_READ_ONLY"
          ? 423
        : 400;
    return errorResponse(error.code, error.message, status, error.fields);
  }
  return errorResponse("INTERNAL_ERROR", "Error interno del servidor.", 500);
}

function stringProperty(document: TlozDocument, key: string) {
  const value = document.properties[key];
  return typeof value === "string" ? value : null;
}
