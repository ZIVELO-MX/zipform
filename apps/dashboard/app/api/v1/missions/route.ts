import { NextRequest, NextResponse } from "next/server";
import { dataClient, TlozValidationError } from "@zipform/data";
import type { TlozMissionStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../lib/api-auth";

const VALID_CREATE_FIELDS = new Set([
  "id", "title", "description", "icon", "type", "status",
  "conclusion", "ownerId", "projectId", "seasonId", "episodeId",
  "dueDate", "startDate", "completedAt", "blockedReason", "progress"
]);

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

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

  try {
    const created = await dataClient.tloz.createMission(allowedFields as Parameters<typeof dataClient.tloz.createMission>[0]);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    if (e instanceof TlozValidationError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Corrige los campos indicados.",
            fields: e.fields,
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
