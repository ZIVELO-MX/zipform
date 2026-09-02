import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateSessionRequest } from "../../../../../../lib/api-auth";
import { authorizeTlozOperation } from "../../../../../../lib/authorization";

async function authenticateKeyManager(request: NextRequest) {
  const auth = await authenticateSessionRequest(request);
  if (auth instanceof Response) return auth;
  const forbidden = authorizeTlozOperation(auth.user, "manage-own-api-keys", { targetUserId: auth.user.id });
  return forbidden.allowed ? auth : Response.json(
    { error: { code: forbidden.code, message: "No tienes permiso para administrar tus API keys.", requestId: crypto.randomUUID() } },
    { status: forbidden.status },
  );
}

export async function GET(request: NextRequest) {
  const auth = await authenticateKeyManager(request);
  if (auth instanceof Response) return auth;
  try {
    return NextResponse.json({ data: await dataClient.agent.listApiKeys(auth.user.id) });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateKeyManager(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 },
    );
  }
  const name = typeof (body as { name?: unknown }).name === "string" ? (body as { name: string }).name.trim() : "";
  if (!name || name.length > 120) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "name es requerido y debe tener máximo 120 caracteres.", requestId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await dataClient.agent.createApiKey(auth.user.id, name, auth.user.id), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
