import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../../lib/api-auth";
import { authorizeMissionOperation } from "../../../../../../../lib/tloz-api-authorization";

export async function DELETE(request: Request, { params }: { params: Promise<{ missionId: string; questItemId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId, questItemId } = await params;
  if (!missionId || missionId.length > 128 || !questItemId || questItemId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId o questItemId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const permission = await authorizeMissionOperation(auth.user, missionId);
    if (!permission.allowed) return permission.response;
    const detail = await dataClient.tloz.removeMissionQuestItem(missionId, questItemId);
    return NextResponse.json({ data: detail });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
