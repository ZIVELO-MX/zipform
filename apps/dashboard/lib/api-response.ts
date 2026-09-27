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

export function invalidBodyResponse() {
  return errorResponse("INVALID_REQUEST", "Cuerpo de solicitud inválido.", 400);
}

export function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function readJsonObject<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return parseJsonObject(await request.json()) as T | null;
  } catch {
    return null;
  }
}

export function validationErrorResponse(fields: Record<string, string>) {
  return errorResponse("INVALID_REQUEST", "Corrige los campos indicados.", 400, fields);
}
