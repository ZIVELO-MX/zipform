import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozResourceType } from "@zipform/types";
import { authenticateRequest } from "../../../../../lib/api-auth";

const VALID_TYPES: TlozResourceType[] = ["link", "document", "image", "file", "note"];

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  let body: { missionId?: string; projectId?: string; questItemId?: string; type?: string; limit?: number; cursor?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (body.type && !VALID_TYPES.includes(body.type as TlozResourceType)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "type debe ser: link, document, image, file o note.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = body.limit ? Math.max(1, Math.min(100, Number(body.limit))) : 25;

  try {
    const result = await dataClient.tloz.findResources(
      { missionId: body.missionId, projectId: body.projectId, questItemId: body.questItemId, type: body.type as TlozResourceType | undefined },
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
