import { dataClient, ContainerContentError } from "@tloz/data";
import { NextRequest } from "next/server";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { authorizeApiOperation } from "../../../../../lib/authorization";
import { errorResponse, handleContainerContentError, parseExpectedRevision, readData, resolveContainer, responseFor } from "../../../../../lib/container-content-api";

type Context = { params: Promise<{ containerId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  try {
    const record = await resolveContainer(dataClient.containerContent, (await params).containerId);
    if (!record) return errorResponse("STORE_NOT_FOUND", "Container no encontrado.", 404);
    return responseFor(request, record);
  } catch (error) { return handleContainerContentError(error); }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const revision = parseExpectedRevision(request);
  if (revision instanceof Response) return revision;
  try {
    const record = await resolveContainer(dataClient.containerContent, (await params).containerId);
    if (!record) return errorResponse("STORE_NOT_FOUND", "Container no encontrado.", 404);
    const ownerId = typeof record.data.ownerId === "string" ? record.data.ownerId : null;
    const forbidden = authorizeApiOperation(auth.user, "update", { ownerId });
    if (forbidden) return forbidden;
    const raw = await request.json() as Record<string, unknown>;
    const allowed = new Set(["slug", "presentation", "title", "summary", "body", "definition", "data"]);
    if (Object.keys(raw).some((key) => !allowed.has(key))) throw new ContainerContentError("STORE_INVALID", "El cuerpo contiene campos no soportados.");
    if (raw.data !== undefined) readData(raw.data);
    const updated = await dataClient.containerContent.updateContainer(record.id, raw as never, revision);
    return responseFor(request, updated);
  } catch (error) { return handleContainerContentError(error); }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const revision = parseExpectedRevision(request);
  if (revision instanceof Response) return revision;
  try {
    const record = await resolveContainer(dataClient.containerContent, (await params).containerId);
    if (!record) return errorResponse("STORE_NOT_FOUND", "Container no encontrado.", 404);
    const forbidden = authorizeApiOperation(auth.user, "structure");
    if (forbidden) return forbidden;
    await dataClient.containerContent.deleteContainer(record.id, revision);
    return new Response(null, { status: 204 });
  } catch (error) { return handleContainerContentError(error); }
}
