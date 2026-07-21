import type { TlozAttachmentFile, TlozAttachmentGroup } from "@zipform/types";

export const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;
export const MAX_ATTACHMENT_COUNT = 20;
export const ALLOWED_ATTACHMENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type AllowedAttachmentType = (typeof ALLOWED_ATTACHMENT_TYPES)[number];

export type AttachmentUploadItem = TlozAttachmentFile & {
  file: File;
};

export type AttachmentUpload = {
  key: string;
  fileName: string;
  contentType: AllowedAttachmentType;
  sizeBytes: number;
  uploadUrl: string;
};

export type AttachmentBatch = {
  uploadBatchId: string;
  generation: number;
  groupKey: string;
  sourceRevision: string;
  status: string;
  uploads: AttachmentUpload[];
};

export class AttachmentClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number | null,
    public readonly stage: "validate" | "prepare" | "upload" | "finalize" | "read",
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "AttachmentClientError";
  }
}

type ApiError = { error?: { code?: unknown; message?: unknown; requestId?: unknown } };

const safeMessages: Record<string, string> = {
  UNAUTHORIZED: "Tu sesión ya no es válida.",
  FORBIDDEN: "No tienes permiso para adjuntar capturas en esta Mission.",
  INVALID_ATTACHMENT_MANIFEST: "La selección no cumple los límites de capturas.",
  attachment_object_missing: "Falta una captura; reintenta ese archivo.",
  attachment_object_invalid: "Una captura no coincide con sus metadatos.",
  batch_superseded: "La revisión cambió; inicia una nueva carga.",
};

function randomHex(byteCount: number) {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createAttachmentGroupKey() {
  return `manual-${randomHex(8)}`;
}

export function createAttachmentRevision() {
  return randomHex(20);
}

export function createAttachmentKey(fileName: string) {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "captura";
  return `${base}-${randomHex(6)}`;
}

export function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.ceil(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateAttachmentFile(file: File) {
  if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
    throw new AttachmentClientError("Tipo no permitido. Usa PNG, JPEG o WebP.", "INVALID_ATTACHMENT_MANIFEST", 400, "validate");
  }
  if (file.size < 1 || file.size > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentClientError("Cada captura debe pesar como máximo 6 MB.", "INVALID_ATTACHMENT_MANIFEST", 400, "validate");
  }
  return file.type as AllowedAttachmentType;
}

export async function readAttachmentDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new AttachmentClientError("No se pudo leer la imagen.", "INVALID_ATTACHMENT_MANIFEST", 400, "validate"));
      image.src = objectUrl;
    });
    if (dimensions.width < 1 || dimensions.height < 1 || dimensions.width > 10000 || dimensions.height > 10000) {
      throw new AttachmentClientError("Las dimensiones de la captura no son válidas.", "INVALID_ATTACHMENT_MANIFEST", 400, "validate");
    }
    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function toAttachmentItem(file: File, key = createAttachmentKey(file.name), title = file.name.replace(/\.[^.]+$/, "")): Promise<AttachmentUploadItem> {
  const contentType = validateAttachmentFile(file);
  const { width, height } = await readAttachmentDimensions(file);
  return { key, title: title.trim() || "Captura", fileName: file.name, contentType, sizeBytes: file.size, width, height, file };
}

export function validateAttachmentCount(items: readonly AttachmentUploadItem[]) {
  if (items.length < 1 || items.length > MAX_ATTACHMENT_COUNT) {
    throw new AttachmentClientError(`Selecciona entre 1 y ${MAX_ATTACHMENT_COUNT} capturas.`, "INVALID_ATTACHMENT_MANIFEST", 400, "validate");
  }
  const keys = new Set<string>();
  for (const item of items) {
    if (keys.has(item.key)) throw new AttachmentClientError("Cada captura debe tener una clave única.", "INVALID_ATTACHMENT_MANIFEST", 400, "validate");
    keys.add(item.key);
  }
  return items;
}

function errorFromResponse(response: Response, body: ApiError | null, stage: AttachmentClientError["stage"]) {
  const code = typeof body?.error?.code === "string" ? body.error.code : `HTTP_${response.status}`;
  const requestId = typeof body?.error?.requestId === "string" ? body.error.requestId : undefined;
  const message = safeMessages[code] ?? (response.status >= 500 ? "El servicio no pudo completar la carga." : "No se pudo completar la carga.");
  return new AttachmentClientError(message, code, response.status, stage, requestId);
}

async function requestJson<T>(path: string, init: RequestInit, stage: AttachmentClientError["stage"], requestFetch: typeof fetch = fetch): Promise<T> {
  let response: Response;
  try {
    response = await requestFetch(path, { ...init, credentials: "same-origin" });
  } catch {
    throw new AttachmentClientError("No se pudo conectar con el servicio de capturas.", "NETWORK_ERROR", null, stage);
  }
  let body: ApiError | null = null;
  try { body = await response.json() as ApiError; } catch { /* direct storage responses may be empty */ }
  if (!response.ok) throw errorFromResponse(response, body, stage);
  return body as T;
}

export function buildAttachmentManifest(groupKey: string, sourceRevision: string, items: readonly AttachmentUploadItem[]) {
  validateAttachmentCount(items);
  return {
    groupKey,
    sourceRevision,
    files: items.map(({ file: _file, ...file }) => file),
  };
}

export async function prepareAttachmentBatch(missionId: string, manifest: ReturnType<typeof buildAttachmentManifest>, signal?: AbortSignal, requestFetch: typeof fetch = fetch) {
  const response = await requestJson<{ data: AttachmentBatch }>(`/api/v1/missions/${encodeURIComponent(missionId)}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(manifest),
    signal,
  }, "prepare", requestFetch);
  return response.data;
}

export async function uploadAttachmentFile(upload: AttachmentUpload, file: File, signal?: AbortSignal, requestFetch: typeof fetch = fetch) {
  let response: Response;
  try {
    response = await requestFetch(upload.uploadUrl, { method: "PUT", headers: { "Content-Type": upload.contentType }, body: file, signal, credentials: "omit" });
  } catch {
    throw new AttachmentClientError("No se pudo subir esta captura.", "UPLOAD_ERROR", null, "upload");
  }
  if (!response.ok) throw new AttachmentClientError("No se pudo subir esta captura.", "UPLOAD_ERROR", response.status, "upload");
}

export async function finalizeAttachmentBatch(missionId: string, uploadBatchId: string, signal?: AbortSignal, requestFetch: typeof fetch = fetch) {
  const response = await requestJson<{ data: TlozAttachmentGroup & { uploadBatchId: string; warnings?: string[] } }>(`/api/v1/missions/${encodeURIComponent(missionId)}/attachments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadBatchId }),
    signal,
  }, "finalize", requestFetch);
  return response.data;
}

export async function fetchExistingAttachment(resource: { url?: string; title: string; contentType?: string }, requestFetch: typeof fetch = fetch) {
  if (!resource.url) throw new AttachmentClientError("No se pudo leer una captura existente.", "READ_ERROR", null, "read");
  let response: Response;
  try { response = await requestFetch(resource.url, { credentials: "omit" }); } catch { throw new AttachmentClientError("No se pudo leer una captura existente.", "READ_ERROR", null, "read"); }
  if (!response.ok) throw new AttachmentClientError("No se pudo leer una captura existente.", "READ_ERROR", response.status, "read");
  const blob = await response.blob();
  return new File([blob], `${resource.title || "captura"}.png`, { type: resource.contentType || blob.type || "image/png" });
}
