import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateSessionRequest } from "../../../../../../../lib/api-auth";
import { authorizeTlozOperation } from "../../../../../../../lib/authorization";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ keyId: string }> }) {
  const auth = await authenticateSessionRequest(request);
  if (auth instanceof Response) return auth;
  const forbidden = authorizeTlozOperation(auth.user, "manage-own-api-keys", { targetUserId: auth.user.id });
  if (!forbidden.allowed) {
    return NextResponse.json(
      { error: { code: forbidden.code, message: "No tienes permiso para administrar tus API keys.", requestId: crypto.randomUUID() } },
      { status: forbidden.status },
    );
  }
  const { keyId } = await params;
  if (!keyId || keyId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "keyId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 },
    );
  }
  try {
    const revoked = await dataClient.agent.revokeApiKey(keyId, auth.user.id);
    if (!revoked) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "API key no encontrada.", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
