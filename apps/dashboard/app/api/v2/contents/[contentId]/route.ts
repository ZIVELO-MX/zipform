import { dataClient } from "@tloz/data";
import { NextRequest } from "next/server";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { authorizeApiOperation } from "../../../../../lib/authorization";
import { errorResponse, handleContainerContentError, parseExpectedRevision, resolveContent, responseFor, readUpdate } from "../../../../../lib/container-content-api";

type Context = { params: Promise<{ contentId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  try {
    const record = await resolveContent(dataClient.containerContent, (await params).contentId);
    if (!record) return errorResponse("STORE_NOT_FOUND", "Content no encontrado.", 404);
    return responseFor(request, record);
  } catch (error) { return handleContainerContentError(error); }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const revision = parseExpectedRevision(request);
  if (revision instanceof Response) return revision;
  try {
    const record = await resolveContent(dataClient.containerContent, (await params).contentId);
    if (!record) return errorResponse("STORE_NOT_FOUND", "Content no encontrado.", 404);
    const ownerId = typeof record.data.ownerId === "string" ? record.data.ownerId : null;
    const forbidden = authorizeApiOperation(auth.user, "update", { ownerId });
    if (forbidden) return forbidden;
    const updated = await dataClient.containerContent.updateContent(record.id, readUpdate(await request.json()), revision);
    await dataClient.activity?.append({ contentId: record.id, entityType: record.presentation, entityId: record.id, entityPublicId: record.publicId, actorId: auth.user.id, action: "content.updated", source: auth.source, metadata: { revision: updated.revision }, idempotencyKey: request.headers.get("idempotency-key") ?? undefined });
    return responseFor(request, updated);
  } catch (error) { return handleContainerContentError(error); }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;
  const revision = parseExpectedRevision(request);
  if (revision instanceof Response) return revision;
  try {
    const record = await resolveContent(dataClient.containerContent, (await params).contentId);
    if (!record) return errorResponse("STORE_NOT_FOUND", "Content no encontrado.", 404);
    const forbidden = authorizeApiOperation(auth.user, "delete-mission");
    if (forbidden) return forbidden;
    await dataClient.activity?.append({ contentId: record.id, entityType: record.presentation, entityId: record.id, entityPublicId: record.publicId, actorId: auth.user.id, action: "content.deleted", source: auth.source, idempotencyKey: request.headers.get("idempotency-key") ?? undefined });
    await dataClient.containerContent.deleteContent(record.id, revision);
    return new Response(null, { status: 204 });
  } catch (error) { return handleContainerContentError(error); }
}
