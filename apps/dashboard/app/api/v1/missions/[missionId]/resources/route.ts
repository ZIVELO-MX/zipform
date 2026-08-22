import { NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import type { TlozResourceType } from "@tloz/types";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import { authorizeMissionOperation } from "../../../../../../lib/tloz-api-authorization";
import { recordMissionActivity } from "../../../../../../lib/mission-activity";

const VALID_TYPES: TlozResourceType[] = ["link", "document", "image", "file", "note"];

export async function POST(request: Request, { params }: { params: Promise<{ missionId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId } = await params;
  if (!missionId || missionId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  let body: { type?: string; title?: string; url?: string; fileId?: string; icon?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (!body.type || !VALID_TYPES.includes(body.type as TlozResourceType) || !body.title) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "type (link|document|image|file|note) y title son requeridos.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const permission = await authorizeMissionOperation(auth.user, missionId);
    if (!permission.allowed) return permission.response;
    const detail = await dataClient.tloz.addMissionResource(
      missionId,
      { type: body.type as TlozResourceType, title: body.title, url: body.url, fileId: body.fileId, icon: body.icon }
    );
    await recordMissionActivity({ mission: detail, actorId: auth.user.id, source: auth.source, action: "mission.resource_added", metadata: { type: body.type }, idempotencyKey: request.headers.get("idempotency-key") });
    return NextResponse.json({ data: detail });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
