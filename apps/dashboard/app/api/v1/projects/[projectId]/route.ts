import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { authorizeProjectOperation } from "../../../../../lib/tloz-api-authorization";

const VALID_PROJECT_FIELDS = new Set([
  "name", "description", "descriptionDetail", "icon", "color",
  "status", "type", "ownerId", "startDate", "dueDate"
]);

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const auth = await authenticateRequest(_request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { projectId } = await params;

  if (!projectId || projectId.length < 1 || projectId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "projectId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const projects = await dataClient.tloz.getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Proyecto no encontrado.", requestId: crypto.randomUUID() } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: project });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { projectId } = await params;
  if (!projectId || projectId.length < 1 || projectId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "projectId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const allowedFields = Object.fromEntries(
    Object.entries(body).filter(([key]) => VALID_PROJECT_FIELDS.has(key))
  );

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "No se proporcionaron campos válidos para actualizar.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const permission = await authorizeProjectOperation(
      auth.user,
      projectId,
      Object.prototype.hasOwnProperty.call(allowedFields, "ownerId") ? "move" : "update",
    );
    if (!permission.allowed) return permission.response;
    const updated = await dataClient.tloz.updateProject(projectId, allowedFields as Parameters<typeof dataClient.tloz.updateProject>[1]);
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
