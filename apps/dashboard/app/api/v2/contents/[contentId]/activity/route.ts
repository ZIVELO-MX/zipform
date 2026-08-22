import { dataClient } from "@tloz/data";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import { errorResponse, resolveContent } from "../../../../../../lib/container-content-api";

type Context = { params: Promise<{ contentId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "25");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return errorResponse("INVALID_REQUEST", "limit debe ser un entero entre 1 y 100.", 400);
  const content = await resolveContent(dataClient.containerContent, (await params).contentId);
  if (!content) return errorResponse("STORE_NOT_FOUND", "Content no encontrado.", 404);
  const result = await dataClient.activity.list(content.id, { limit, cursor: request.nextUrl.searchParams.get("cursor") ?? undefined });
  return NextResponse.json(result);
}
