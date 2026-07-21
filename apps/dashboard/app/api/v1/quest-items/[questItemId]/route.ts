import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { authorizeQuestItemOperation } from "../../../../../lib/tloz-api-authorization";

const VALID_QUESTITEM_FIELDS = new Set([
  "name", "description", "descriptionDetail", "icon", "status",
  "category", "ownerId", "acquiredAt"
]);

export async function GET(_request: Request, { params }: { params: Promise<{ questItemId: string }> }) {
  const auth = await authenticateRequest(_request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { questItemId } = await params;

  if (!questItemId || questItemId.length < 1 || questItemId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "questItemId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const items = await dataClient.tloz.getQuestItems();
    const item = items.find((q) => q.id === questItemId);
    if (!item) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quest item no encontrado.", requestId: crypto.randomUUID() } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: item });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ questItemId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { questItemId } = await params;
  if (!questItemId || questItemId.length < 1 || questItemId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "questItemId inválido.", requestId: crypto.randomUUID() } },
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
    Object.entries(body).filter(([key]) => VALID_QUESTITEM_FIELDS.has(key))
  );

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "No se proporcionaron campos válidos para actualizar.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const permission = await authorizeQuestItemOperation(
      auth.user,
      questItemId,
      Object.prototype.hasOwnProperty.call(allowedFields, "ownerId") ? "move" : "update",
    );
    if (!permission.allowed) return permission.response;
    const updated = await dataClient.tloz.updateQuestItem(questItemId, allowedFields as Parameters<typeof dataClient.tloz.updateQuestItem>[1]);
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
