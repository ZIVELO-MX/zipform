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
    const records = await dataClient.containerContent.listContainers({ presentation: request.nextUrl.searchParams.get("presentation") ?? undefined });
    return NextResponse.json(page(records, request.nextUrl.searchParams.get("cursor"), limit));
  } catch (error) { return handleContainerContentError(error); }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  try {
    const raw = await request.json() as Record<string, unknown>;
    if (typeof raw.publicId !== "string" || typeof raw.presentation !== "string" || typeof raw.title !== "string") throw new ContainerContentError("STORE_INVALID", "publicId, presentation y title son obligatorios.", { title: "required" });
    const publicId = raw.publicId;
    const presentation = raw.presentation;
    const title = raw.title;
    const data = readData(raw.data ?? {});
    const ownerId = typeof data.ownerId === "string" ? data.ownerId : auth.user.id;
    const forbidden = authorizeApiOperation(auth.user, "create", { requestedOwnerId: ownerId });
    if (forbidden) return forbidden;
    const record = await dataClient.containerContent.createContainer({
      id: typeof raw.id === "string" ? raw.id : undefined,
      publicId,
      slug: typeof raw.slug === "string" ? raw.slug : undefined,
      presentation,
      title,
      summary: typeof raw.summary === "string" ? raw.summary : "",
      body: typeof raw.body === "string" ? raw.body : "",
      definition: raw.definition && typeof raw.definition === "object" && !Array.isArray(raw.definition) ? raw.definition as never : { fields: [], views: [{ id: "default", fields: [] }], defaultView: "default" },
      data,
    });
    return new Response(responseBody(record), { status: 201, headers: { "Content-Type": "application/json", ETag: `"${record.revision}"`, Location: `/api/v2/containers/${encodeURIComponent(record.publicId)}` } });
  } catch (error) { return handleContainerContentError(error); }
}

function responseBody(record: unknown) { return JSON.stringify({ data: record }); }
