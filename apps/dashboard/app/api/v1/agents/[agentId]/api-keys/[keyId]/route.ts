import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../../lib/api-auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ agentId: string; keyId: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { agentId, keyId } = await params;

  if (!agentId || agentId.length > 128 || !keyId || keyId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "agentId o keyId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    await dataClient.agent.revokeApiKey(keyId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
