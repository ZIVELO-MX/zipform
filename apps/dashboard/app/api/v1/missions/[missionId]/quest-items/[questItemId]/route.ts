import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../../lib/api-auth";

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
    const detail = await dataClient.tloz.removeMissionQuestItem(missionId, questItemId);
    return NextResponse.json({ data: detail });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message || "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
