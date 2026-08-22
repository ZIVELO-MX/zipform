import { NextResponse } from "next/server";

export function revisionEtag(revision: number) {
  return `"${revision}"`;
}

export function parseExpectedRevision(
  request: Request,
  requiredMessage = "If-Match es obligatorio.",
): number | Response {
  const value = request.headers.get("if-match");
  if (!value) return errorResponse("PRECONDITION_REQUIRED", requiredMessage, 428);

  const revision = Number(value.replace(/^W\//, "").replace(/^"|"$/g, ""));
  if (!Number.isInteger(revision) || revision < 1) {
    return errorResponse("INVALID_REQUEST", "If-Match no contiene una revisión válida.", 400);
  }
  return revision;
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
