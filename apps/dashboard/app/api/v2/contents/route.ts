import { dataClient, ContainerContentError } from "@tloz/data";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../../lib/api-auth";
import { authorizeApiOperation } from "../../../../lib/authorization";
import { errorResponse, handleContainerContentError, readData, resolveContainer } from "../../../../lib/container-content-api";

function page<T extends { id: string }>(records: T[], cursor: string | null, limit: number) {
  const start = cursor ? Math.max(records.findIndex((item) => item.id === cursor) + 1, 0) : 0;
  const data = records.slice(start, start + limit);
  return { data, nextCursor: start + data.length < records.length ? data.at(-1)?.id ?? null : null };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "25");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return errorResponse("INVALID_REQUEST", "limit debe ser un entero entre 1 y 100.", 400);
  try {
    const rawData = request.nextUrl.searchParams.get("data");
    let dataFilters;
    if (rawData) {
      try { dataFilters = readData(JSON.parse(rawData)); }
      catch (error) { if (error instanceof ContainerContentError) throw error; throw new ContainerContentError("STORE_INVALID", "data no contiene JSON válido.", { data: "invalid" }); }
    }
    const records = await dataClient.containerContent.listContents({
      containerId: request.nextUrl.searchParams.get("containerId") ?? undefined,
      presentation: request.nextUrl.searchParams.get("presentation") ?? undefined,
      data: dataFilters as never,
    });
    return NextResponse.json(page(records, request.nextUrl.searchParams.get("cursor"), limit));
  } catch (error) { return handleContainerContentError(error); }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  try {
    const raw = await request.json() as Record<string, unknown>;
    if (typeof raw.publicId !== "string" || typeof raw.containerId !== "string" || typeof raw.presentation !== "string" || typeof raw.title !== "string") throw new ContainerContentError("STORE_INVALID", "publicId, containerId, presentation y title son obligatorios.");
    const publicId = raw.publicId;
    const containerId = raw.containerId;
    const presentation = raw.presentation;
    const title = raw.title;
    const container = await resolveContainer(dataClient.containerContent, containerId);
    if (!container) return errorResponse("STORE_REFERENCE_INVALID", "containerId no existe.", 400, { containerId: "not_found" });
    const data = readData(raw.data ?? {});
    const ownerId = typeof data.ownerId === "string" ? data.ownerId : auth.user.id;
    const forbidden = authorizeApiOperation(auth.user, "create", { requestedOwnerId: ownerId });
    if (forbidden) return forbidden;
    const record = await dataClient.containerContent.createContent({
      id: typeof raw.id === "string" ? raw.id : undefined,
      publicId,
      containerId: container.id,
      presentation,
      title,
      summary: typeof raw.summary === "string" ? raw.summary : "",
      body: typeof raw.body === "string" ? raw.body : "",
      data,
    });
    return new Response(JSON.stringify({ data: record }), { status: 201, headers: { "Content-Type": "application/json", ETag: `"${record.revision}"`, Location: `/api/v2/contents/${encodeURIComponent(record.publicId)}` } });
  } catch (error) { return handleContainerContentError(error); }
}
