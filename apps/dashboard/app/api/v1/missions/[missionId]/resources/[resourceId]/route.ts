import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../../lib/api-auth";
import { authorizeMissionOperation } from "../../../../../../../lib/tloz-api-authorization";

export async function DELETE(request: Request, { params }: { params: Promise<{ missionId: string; resourceId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId, resourceId } = await params;
  if (!missionId || missionId.length > 128 || !resourceId || resourceId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId o resourceId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const permission = await authorizeMissionOperation(auth.user, missionId);
    if (!permission.allowed) return permission.response;
    if (!permission.entity.resources.some((resource) => resource.id === resourceId)) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Recurso no encontrado.", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }
    const detail = await dataClient.tloz.removeMissionResource(missionId, resourceId);
    return NextResponse.json({ data: detail });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
