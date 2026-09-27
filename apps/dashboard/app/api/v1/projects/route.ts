import { NextRequest, NextResponse } from "next/server";
import { dataClient, TlozValidationError } from "@tloz/data";
import { isTlozProjectStatus, type TlozProjectStatus } from "@tloz/types";
import { authenticateRequest } from "../../../../lib/api-auth";
import { invalidBodyResponse, parseJsonObject, validationErrorResponse } from "../../../../lib/api-response";
import { authorizeApiOperation, isFullStackDeveloper } from "../../../../lib/authorization";
import { paginationErrorResponse, parsePaginationLimit } from "../../../../lib/api-pagination";

const VALID_PROJECT_FIELDS = new Set([
  "name", "description", "descriptionDetail", "icon", "color",
  "status", "type", "ownerId", "startDate", "dueDate"
]);

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const status = searchParams.get("status");
  const limitParam = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  if (status && !isTlozProjectStatus(status)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser active, maintenance, paused o completed.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = parsePaginationLimit(limitParam);
  if (limit instanceof Response) return limit;

  try {
    const result = await dataClient.tloz.findProjects(
      { ownerId: ownerId ?? undefined, status: (status as TlozProjectStatus) ?? undefined },
      { limit, cursor: cursor ?? undefined }
    );
    return NextResponse.json(result);
  } catch (error) {
    const paginationResponse = paginationErrorResponse(error);
    if (paginationResponse) return paginationResponse;
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown> | null;
  try {
    body = parseJsonObject(await request.json());
  } catch {
    body = null;
  }
  if (!body) return invalidBodyResponse();

  const allowedFields = Object.fromEntries(
    Object.entries(body).filter(([key]) => VALID_PROJECT_FIELDS.has(key))
  );

  if (isFullStackDeveloper(auth.user) && !allowedFields.ownerId) allowedFields.ownerId = auth.user.id;

  if (!allowedFields.name) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "name es requerido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }
  if (allowedFields.status !== undefined && !isTlozProjectStatus(allowedFields.status)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser active, maintenance, paused o completed.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const forbidden = authorizeApiOperation(auth.user, "create", {
      requestedOwnerId: typeof allowedFields.ownerId === "string" ? allowedFields.ownerId : null,
    });
    if (forbidden) return forbidden;
    const created = await dataClient.tloz.createProject(allowedFields as Parameters<typeof dataClient.tloz.createProject>[0]);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof TlozValidationError) return validationErrorResponse(error.fields);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
