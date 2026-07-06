import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozProjectStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../../lib/api-auth";

const VALID_STATUSES: TlozProjectStatus[] = ["planned", "active", "archived"];

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  let body: { ownerId?: string; status?: string; limit?: number; cursor?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (body.status && !VALID_STATUSES.includes(body.status as TlozProjectStatus)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser planned, active o archived.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = body.limit ? Math.max(1, Math.min(100, Number(body.limit))) : 25;

  try {
    const result = await dataClient.tloz.findProjects(
      { ownerId: body.ownerId, status: body.status as TlozProjectStatus | undefined },
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
