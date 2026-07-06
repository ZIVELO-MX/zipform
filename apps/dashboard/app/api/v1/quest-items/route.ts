import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozInventoryCategory, TlozInventoryStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../lib/api-auth";

const validStatuses: TlozInventoryStatus[] = ["locked", "unlocked"];
const validCategories: TlozInventoryCategory[] = ["tool", "access", "asset", "document", "other"];

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
