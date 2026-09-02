import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateSessionRequest } from "../../../../../../../lib/api-auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ agentId: string; keyId: string }> }) {
  const auth = await authenticateSessionRequest(request);
  if (auth instanceof Response) return auth;

  const { agentId, keyId } = await params;

  if (!agentId || agentId.length > 128 || !keyId || keyId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "agentId o keyId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const agents = await dataClient.agent.list();
    if (!agents.some((agent) => agent.id === agentId)) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agente no encontrado.", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }
    const revoked = await dataClient.agent.revokeApiKey(keyId, agentId);
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
      { status: 500 }
    );
  }
}
