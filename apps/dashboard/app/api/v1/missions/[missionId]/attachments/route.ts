import { dataClient, TlozAttachmentError } from "@zipform/data";
import type { TlozAttachmentGroup } from "@zipform/types";
import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import { attachmentStoragePath, getTlozAttachmentStorage, TlozAttachmentRequestError, validateAttachmentManifest } from "../../../../../../lib/tloz-attachment-storage";

type RouteContext = { params: Promise<{ missionId: string }> };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, requestId: crypto.randomUUID() } }, { status });
}

function mapError(error: unknown) {
  if (error instanceof TlozAttachmentRequestError) return error.code === "INVALID_ATTACHMENT_MANIFEST" ? errorResponse(400, error.code, error.message) : errorResponse(503, error.code, error.message);
  if (error instanceof TlozAttachmentError) {
    if (error.code === "ATTACHMENT_MISSION_NOT_FOUND" || error.code === "ATTACHMENT_BATCH_NOT_FOUND") return errorResponse(404, error.code, error.message);
    if (error.code === "ATTACHMENT_BATCH_SUPERSEDED") return errorResponse(409, "batch_superseded", error.message);
  }
  return errorResponse(500, "INTERNAL_ERROR", "Error interno del servidor.");
}

function validateMissionId(missionId: string) {
  return missionId.length > 0 && missionId.length <= 128;
}

async function signedGroup(group: TlozAttachmentGroup) {
  const storage = getTlozAttachmentStorage();
  return {
    ...group,
    attachments: await Promise.all(group.attachments.map(async (attachment) => {
      const url = await storage.createSignedRead(attachment.storagePath ?? "", 3600);
      const { storagePath: _storagePath, ...publicAttachment } = attachment;
      return { ...publicAttachment, url };
    })),
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { missionId } = await params;
  if (!validateMissionId(missionId)) return errorResponse(400, "INVALID_REQUEST", "missionId inválido.");

  try {
    const manifest = validateAttachmentManifest(await request.json());
    const storage = getTlozAttachmentStorage();
    const filesWithPaths = manifest.files.map((file) => {
      const storagePath = attachmentStoragePath(missionId, manifest.groupKey, file.key, file.contentType);
      return { ...file, storagePath };
    });
    const batch = await dataClient.tloz.prepareAttachmentBatch(missionId, manifest.groupKey, manifest.sourceRevision, filesWithPaths);
    const uploads = await Promise.all(batch.files.map(async (file) => ({ ...file, ...(await storage.createSignedUpload(file.storagePath, file.contentType)) })));
    return NextResponse.json({ data: { uploadBatchId: batch.uploadBatchId, generation: batch.generation, groupKey: batch.groupKey, sourceRevision: batch.sourceRevision, status: batch.status, uploads: uploads.map(({ key, fileName, contentType, sizeBytes, storagePath, uploadUrl }) => ({ key, fileName, contentType, sizeBytes, storagePath, uploadUrl })) } });
  } catch (error) {
    return mapError(error);
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { missionId } = await params;
  if (!validateMissionId(missionId)) return errorResponse(400, "INVALID_REQUEST", "missionId inválido.");

  try {
    const body = await request.json() as { uploadBatchId?: unknown };
    if (typeof body.uploadBatchId !== "string" || body.uploadBatchId.length < 1 || body.uploadBatchId.length > 128) return errorResponse(400, "INVALID_REQUEST", "uploadBatchId es requerido.");
    const batch = await dataClient.tloz.getAttachmentBatch(body.uploadBatchId);
    if (batch.missionId !== missionId) return errorResponse(404, "ATTACHMENT_BATCH_NOT_FOUND", "El lote de capturas no existe para esta Mission.");
    const storage = getTlozAttachmentStorage();
    if (batch.status !== "finalized") {
      for (const file of batch.files) {
        const object = await storage.inspectObject(file.storagePath);
        if (!object) return errorResponse(400, "attachment_object_missing", `Falta el objeto de captura para ${file.key}.`);
        if (object.contentType !== file.contentType || object.sizeBytes !== file.sizeBytes) return errorResponse(400, "attachment_object_invalid", `El objeto de captura para ${file.key} no coincide con el manifiesto.`);
      }
    }
    const result = await dataClient.tloz.finalizeAttachmentBatch(batch.uploadBatchId);
    const warnings: string[] = [];
    for (const path of result.previousStoragePaths) {
      try { await storage.removeObject(path); } catch { warnings.push("No se pudo limpiar un objeto anterior; el snapshot nuevo permanece activo."); }
    }
    const group = await signedGroup(result.group);
    return NextResponse.json({ data: { ...group, uploadBatchId: result.batch.uploadBatchId, warnings: [...new Set(warnings)] } });
  } catch (error) {
    return mapError(error);
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { missionId } = await params;
  if (!validateMissionId(missionId)) return errorResponse(400, "INVALID_REQUEST", "missionId inválido.");
  try {
    const groups = await dataClient.tloz.getAttachmentGroups(missionId);
    return NextResponse.json({ data: await Promise.all(groups.map(signedGroup)) });
  } catch (error) {
    return mapError(error);
  }
}
