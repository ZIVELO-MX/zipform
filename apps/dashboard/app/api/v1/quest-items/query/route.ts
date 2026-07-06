import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozInventoryCategory, TlozInventoryStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../../lib/api-auth";

const VALID_STATUSES: TlozInventoryStatus[] = ["locked", "unlocked"];
const VALID_CATEGORIES: TlozInventoryCategory[] = ["tool", "access", "asset", "document", "other"];

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  let body: { ownerId?: string; status?: string; category?: string; limit?: number; cursor?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (body.status && !VALID_STATUSES.includes(body.status as TlozInventoryStatus)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser: locked o unlocked.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (body.category && !VALID_CATEGORIES.includes(body.category as TlozInventoryCategory)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "category debe ser: tool, access, asset, document u other.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = body.limit ? Math.max(1, Math.min(100, Number(body.limit))) : 25;

  try {
    const result = await dataClient.tloz.findQuestItems(
      { ownerId: body.ownerId, status: body.status as TlozInventoryStatus | undefined, category: body.category as TlozInventoryCategory | undefined },
      { limit, cursor: body.cursor }
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
