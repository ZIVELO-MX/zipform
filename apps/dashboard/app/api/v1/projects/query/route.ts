import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { isTlozProjectStatus, type TlozProjectStatus } from "@tloz/types";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { paginationErrorResponse, parsePaginationLimit } from "../../../../../lib/api-pagination";
import { readJsonObject } from "../../../../../lib/api-response";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const body = await readJsonObject<{ ownerId?: string; status?: string; limit?: number; cursor?: string }>(request);
  if (!body) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400  }
    );
  }

  if (body.status && !isTlozProjectStatus(body.status)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser active, maintenance, paused o completed.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = parsePaginationLimit(body.limit);
  if (limit instanceof Response) return limit;

  try {
    const result = await dataClient.tloz.findProjects(
      { ownerId: body.ownerId, status: body.status as TlozProjectStatus | undefined },
      { limit, cursor: body.cursor }
    );
    return NextResponse.json(result);
  } catch (error) {
    const paginationResponse = paginationErrorResponse(error);
    if (paginationResponse) return paginationResponse;
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
