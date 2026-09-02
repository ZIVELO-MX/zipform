import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateSessionRequest } from "../../../../../../lib/api-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const auth = await authenticateSessionRequest(request);
  if (auth instanceof Response) return auth;

  const { agentId } = await params;

  if (!agentId || agentId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "agentId inválido.", requestId: crypto.randomUUID() } },
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
    const keys = await dataClient.agent.listApiKeys(agentId);
    return NextResponse.json({ data: keys });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const auth = await authenticateSessionRequest(request);
  if (auth instanceof Response) return auth;

  const { agentId } = await params;

  if (!agentId || agentId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "agentId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const name = (body as { name?: string }).name;
  if (!name) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "name es requerido.", requestId: crypto.randomUUID() } },
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
    const result = await dataClient.agent.createApiKey(agentId, name, auth.user.id);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
