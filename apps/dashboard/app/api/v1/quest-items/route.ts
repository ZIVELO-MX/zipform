import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozInventoryCategory, TlozInventoryStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../lib/api-auth";
import { authorizeApiOperation, isFullStackDeveloper } from "../../../../lib/authorization";

const validStatuses: TlozInventoryStatus[] = ["locked", "unlocked"];
const validCategories: TlozInventoryCategory[] = ["tool", "access", "asset", "document", "other"];
const VALID_CREATE_FIELDS = new Set([
  "name", "description", "descriptionDetail", "icon", "status",
  "category", "ownerId", "acquiredAt"
]);

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const status = searchParams.get("status") as TlozInventoryStatus | null;
  const category = searchParams.get("category") as TlozInventoryCategory | null;
  const limitParam = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser: locked o unlocked.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (category && !validCategories.includes(category)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "category debe ser: tool, access, asset, document u other.", requestId: crypto.randomUUID() } },
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
    const result = await dataClient.tloz.findQuestItems(
      { ownerId: ownerId ?? undefined, status: status ?? undefined, category: category ?? undefined },
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
    Object.entries(body).filter(([key]) => VALID_CREATE_FIELDS.has(key))
  );

  if (isFullStackDeveloper(auth.user) && !allowedFields.ownerId) allowedFields.ownerId = auth.user.id;

  if (!allowedFields.name) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "name es requerido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const forbidden = authorizeApiOperation(auth.user, "create", {
      requestedOwnerId: typeof allowedFields.ownerId === "string" ? allowedFields.ownerId : null,
    });
    if (forbidden) return forbidden;
    const created = await dataClient.tloz.createQuestItem(allowedFields as Parameters<typeof dataClient.tloz.createQuestItem>[0]);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
