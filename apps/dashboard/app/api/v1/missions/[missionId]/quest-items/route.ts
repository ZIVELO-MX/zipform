import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../lib/api-auth";

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

  let body: { questItemId?: string; required?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (!body.questItemId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "questItemId es requerido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const detail = await dataClient.tloz.setMissionQuestItem(missionId, body.questItemId, body.required ?? false);
    return NextResponse.json({ data: detail });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message || "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
