import { NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import { paginationErrorResponse, parsePaginationLimit } from "../../../../../../lib/api-pagination";

type Context = { params: Promise<{ missionId: string }> };

export async function GET(request: Request, { params }: Context) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId } = await params;
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Misión no encontrada.", requestId: crypto.randomUUID() } }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = parsePaginationLimit(url.searchParams.get("limit"));
  if (limit instanceof Response) return limit;

  try {
    const result = await dataClient.activity.list(mission.id, {
      limit,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({ data: result.data, nextCursor: result.nextCursor });
  } catch (error) {
    return paginationErrorResponse(error) ?? NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
