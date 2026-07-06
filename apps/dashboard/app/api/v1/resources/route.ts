import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozResourceType } from "@zipform/types";
import { authenticateRequest } from "../../../../lib/api-auth";

const validTypes: TlozResourceType[] = ["link", "document", "image", "file", "note"];

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get("missionId");
  const projectId = searchParams.get("projectId");
  const questItemId = searchParams.get("questItemId");
  const type = searchParams.get("type") as TlozResourceType | null;
  const limitParam = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  if (type && !validTypes.includes(type)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "type debe ser: link, document, image, file o note.", requestId: crypto.randomUUID() } },
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
    const result = await dataClient.tloz.findResources(
      { missionId: missionId ?? undefined, projectId: projectId ?? undefined, questItemId: questItemId ?? undefined, type: type ?? undefined },
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
