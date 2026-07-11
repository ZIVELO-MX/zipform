import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozMissionStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../../../lib/api-auth";

const VALID_STATUSES: TlozMissionStatus[] = ["now", "next", "later", "completed", "blocked"];

export async function PATCH(request: Request, { params }: { params: Promise<{ missionId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId } = await params;
  if (!missionId || missionId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (!body.status || !VALID_STATUSES.includes(body.status as TlozMissionStatus)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status es requerido. Debe ser: now, next, later, completed o blocked.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    await dataClient.tloz.patchMissionStatus(missionId, body.status as TlozMissionStatus);
    return NextResponse.json({ data: await dataClient.tloz.getMissionDetail(missionId) });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message || "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
