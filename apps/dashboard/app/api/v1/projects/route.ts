import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozProjectStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../lib/api-auth";

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

  if (status && !["planned", "active", "archived"].includes(status)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser planned, active o archived.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam))) : 25;
  if (isNaN(limit)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "limit debe ser un número entre 1 y 100.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const result = await dataClient.tloz.findProjects(
      { ownerId: ownerId ?? undefined, status: (status as TlozProjectStatus) ?? undefined },
      { limit, cursor: cursor ?? undefined }
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

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

  if (!allowedFields.name) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "name es requerido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const created = await dataClient.tloz.createProject(allowedFields as Parameters<typeof dataClient.tloz.createProject>[0]);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message || "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
