import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { dataClient } from "@zipform/data";
import type { TlozMissionStatus } from "@zipform/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa.", requestId: crypto.randomUUID() } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const ownerId = searchParams.get("ownerId");
  const status = searchParams.get("status") as TlozMissionStatus | null;
  const seasonId = searchParams.get("seasonId");
  const episodeId = searchParams.get("episodeId");
  const title = searchParams.get("title");
  const limitParam = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  const validStatuses: TlozMissionStatus[] = ["now", "next", "later", "completed", "blocked"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser: now, next, later, completed o blocked.", requestId: crypto.randomUUID() } },
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
    const result = await dataClient.tloz.findMissions(
      { projectId: projectId ?? undefined, ownerId: ownerId ?? undefined, status: status ?? undefined, seasonId: seasonId ?? undefined, episodeId: episodeId ?? undefined, title: title ?? undefined },
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
