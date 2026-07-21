import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozMissionStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { isReadOnlyAgent, toPublicMissionOwner } from "../../../../../lib/authorization";

const VALID_STATUSES: TlozMissionStatus[] = ["now", "next", "later", "completed", "blocked"];

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  let body: {
    projectId?: string; ownerId?: string; status?: string;
    seasonId?: string; episodeId?: string; title?: string;
    limit?: number; cursor?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (body.status && !VALID_STATUSES.includes(body.status as TlozMissionStatus)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser: now, next, later, completed o blocked.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = body.limit ? Math.max(1, Math.min(100, Number(body.limit))) : 25;

  try {
    const result = await dataClient.tloz.findMissions(
      {
        projectId: body.projectId,
        ownerId: body.ownerId,
        status: body.status as TlozMissionStatus | undefined,
        seasonId: body.seasonId,
        episodeId: body.episodeId,
        title: body.title,
      },
      { limit, cursor: body.cursor }
    );
    return NextResponse.json(isReadOnlyAgent(auth.user)
      ? { ...result, data: result.data.map(toPublicMissionOwner) }
      : result);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
