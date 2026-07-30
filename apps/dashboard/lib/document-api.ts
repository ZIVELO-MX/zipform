import {
  serializeTlozDocumentMarkdown,
  TlozDocumentError,
} from "@tloz/data";
import type { TlozDocument } from "@tloz/types";
import { NextResponse } from "next/server";
import { authorizeApiOperation, type TlozOperation } from "./authorization";

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
  const value = request.headers.get("if-match");
  if (!value) {
    return errorResponse(
      "PRECONDITION_REQUIRED",
      "If-Match con la revisión vigente es obligatorio.",
      428,
    );
  }
  const normalized = value.replace(/^W\//, "").replace(/^"|"$/g, "");
  const revision = Number(normalized);
  if (!Number.isInteger(revision) || revision < 1) {
    return errorResponse("INVALID_REQUEST", "If-Match no contiene una revisión válida.", 400);
  }
  return revision;
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
        : 400;
    return errorResponse(error.code, error.message, status, error.fields);
  }
  return errorResponse("INTERNAL_ERROR", "Error interno del servidor.", 500);
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json({
    error: {
      code,
      message,
      ...(fields && Object.keys(fields).length ? { fields } : {}),
      requestId: crypto.randomUUID(),
    },
  }, { status });
}

export function revisionEtag(revision: number) {
  return `"${revision}"`;
}

function stringProperty(document: TlozDocument, key: string) {
  const value = document.properties[key];
  return typeof value === "string" ? value : null;
}
