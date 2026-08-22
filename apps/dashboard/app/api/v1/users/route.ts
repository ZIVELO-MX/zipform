import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateRequest } from "../../../../lib/api-auth";
import { authorizeApiOperation, isReadOnlyAgent, toPublicUserProfile } from "../../../../lib/authorization";
import { paginationErrorResponse, parsePaginationLimit } from "../../../../lib/api-pagination";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const username = searchParams.get("username");
  const limitParam = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  if (email && username) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Solo se permite un filtro a la vez (email o username).", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }
  if (email) {
    const forbidden = authorizeApiOperation(auth.user, "read-sensitive-user");
    if (forbidden) return forbidden;
  }

  const limit = parsePaginationLimit(limitParam);
  if (limit instanceof Response) return limit;

  try {
    const result = await dataClient.tloz.findUsers(
      email ? { email } : username ? { username } : undefined,
      { limit, cursor: cursor ?? undefined }
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
