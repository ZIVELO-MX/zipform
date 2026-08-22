import { NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateRequest } from "../../../../../../../lib/api-auth";
import { authorizeMissionOperation } from "../../../../../../../lib/tloz-api-authorization";
import { recordMissionActivity } from "../../../../../../../lib/mission-activity";

export async function DELETE(request: Request, { params }: { params: Promise<{ missionId: string; dependencyId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId, dependencyId } = await params;
  if (!missionId || missionId.length > 128 || !dependencyId || dependencyId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId o dependencyId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const permission = await authorizeMissionOperation(auth.user, missionId);
    if (!permission.allowed) return permission.response;
    const detail = await dataClient.tloz.removeMissionDependency(missionId, dependencyId);
    await recordMissionActivity({ mission: detail, actorId: auth.user.id, source: auth.source, action: "mission.dependency_removed", metadata: { dependencyId }, idempotencyKey: request.headers.get("idempotency-key") });
    return NextResponse.json({ data: detail });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
