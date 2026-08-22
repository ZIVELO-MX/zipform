import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { authorizeApiOperation, isReadOnlyAgent, toPublicUserProfile } from "../../../../../lib/authorization";
import { paginationErrorResponse, parsePaginationLimit } from "../../../../../lib/api-pagination";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  let body: { email?: string; username?: string; limit?: number; cursor?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (body.email && body.username) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Solo se permite un filtro a la vez (email o username).", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }
  if (body.email) {
    const forbidden = authorizeApiOperation(auth.user, "read-sensitive-user");
    if (forbidden) return forbidden;
  }

  const limit = parsePaginationLimit(body.limit);
  if (limit instanceof Response) return limit;

  try {
    const result = await dataClient.tloz.findUsers(
      body.email ? { email: body.email } : body.username ? { username: body.username } : undefined,
      { limit, cursor: body.cursor }
    );
    return NextResponse.json(isReadOnlyAgent(auth.user)
      ? { ...result, data: result.data.map(toPublicUserProfile) }
      : result);
  } catch (error) {
    const paginationResponse = paginationErrorResponse(error);
    if (paginationResponse) return paginationResponse;
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
