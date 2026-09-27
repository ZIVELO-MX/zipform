import { NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import type { TlozInventoryCategory, TlozInventoryStatus } from "@tloz/types";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { invalidBodyResponse, parseJsonObject } from "../../../../../lib/api-response";
import { authorizeQuestItemOperation } from "../../../../../lib/tloz-api-authorization";

const VALID_QUESTITEM_FIELDS = new Set([
  "name", "description", "descriptionDetail", "icon", "status",
  "category", "ownerId", "acquiredAt"
]);
const VALID_STATUSES: TlozInventoryStatus[] = ["locked", "unlocked"];
const VALID_CATEGORIES: TlozInventoryCategory[] = ["tool", "access", "asset", "document", "other"];

function questItemEnumError(fields: Record<string, unknown>) {
  if (fields.status !== undefined && !VALID_STATUSES.includes(fields.status as TlozInventoryStatus)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser: locked o unlocked.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }
  if (fields.category !== undefined && !VALID_CATEGORIES.includes(fields.category as TlozInventoryCategory)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "category debe ser: tool, access, asset, document u other.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }
  return null;
}

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
    const item = await dataClient.tloz.getQuestItem(questItemId);
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

  let body: Record<string, unknown> | null;
  try {
    body = parseJsonObject(await request.json());
  } catch {
    body = null;
  }
  if (!body) return invalidBodyResponse();

  const allowedFields = Object.fromEntries(
    Object.entries(body).filter(([key]) => VALID_QUESTITEM_FIELDS.has(key))
  );

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "No se proporcionaron campos válidos para actualizar.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const enumError = questItemEnumError(allowedFields);
  if (enumError) return enumError;

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
