import type { TlozAttachmentFile } from "@zipform/types";

export const TLOZ_ATTACHMENTS_BUCKET = process.env.TLOZ_ATTACHMENTS_BUCKET ?? "tloz-attachments";
export const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;
export const MAX_ATTACHMENT_COUNT = 20;
export const ALLOWED_ATTACHMENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export class TlozAttachmentRequestError extends Error {
  constructor(public readonly code: "INVALID_ATTACHMENT_MANIFEST" | "ATTACHMENT_STORAGE_NOT_CONFIGURED" | "ATTACHMENT_STORAGE_ERROR", message: string) {
    super(message);
    this.name = "TlozAttachmentRequestError";
  }
}

export type AttachmentManifest = {
  groupKey: string;
  sourceRevision: string;
  files: TlozAttachmentFile[];
};

export type AttachmentStorage = {
  createSignedUpload(path: string, contentType: string): Promise<{ uploadUrl: string }>;
  inspectObject(path: string): Promise<{ contentType: string; sizeBytes: number } | null>;
  createSignedRead(path: string, expiresInSeconds: number): Promise<string>;
  removeObject(path: string): Promise<void>;
};

const GROUP_KEY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const EXTERNAL_KEY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const REVISION = /^[0-9a-f]{40}$/i;
const FILE_NAME = /^[^/\\\0]{1,200}$/;

function invalid(message: string): never {
  throw new TlozAttachmentRequestError("INVALID_ATTACHMENT_MANIFEST", message);
}

export function validateAttachmentManifest(value: unknown): AttachmentManifest {
  if (!value || typeof value !== "object") invalid("El manifiesto debe ser un objeto.");
  const body = value as Record<string, unknown>;
  const groupKey = body.groupKey;
  const sourceRevision = body.sourceRevision;
  const files = body.files;
  if (typeof groupKey !== "string" || !GROUP_KEY.test(groupKey)) invalid("groupKey debe usar entre 1 y 64 caracteres seguros.");
  if (typeof sourceRevision !== "string" || !REVISION.test(sourceRevision)) invalid("sourceRevision debe ser un SHA completo de 40 caracteres.");
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_ATTACHMENT_COUNT) invalid(`files debe contener entre 1 y ${MAX_ATTACHMENT_COUNT} elementos.`);

  const keys = new Set<string>();
  const normalized = files.map((value, index) => {
    if (!value || typeof value !== "object") invalid(`files[${index}] debe ser un objeto.`);
    const file = value as Record<string, unknown>;
    const key = file.key;
    const title = file.title;
    const fileName = file.fileName;
    const contentType = file.contentType;
    const sizeBytes = file.sizeBytes;
    const width = file.width;
    const height = file.height;
    if (typeof key !== "string" || !EXTERNAL_KEY.test(key) || keys.has(key)) invalid(`files[${index}].key es inválida o está duplicada.`);
    if (typeof title !== "string" || title.trim().length < 1 || title.length > 200) invalid(`files[${index}].title es inválido.`);
    if (typeof fileName !== "string" || !FILE_NAME.test(fileName)) invalid(`files[${index}].fileName es inválido.`);
    if (typeof contentType !== "string" || !(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(contentType)) invalid(`files[${index}].contentType no está permitido.`);
    if (!Number.isInteger(sizeBytes) || (sizeBytes as number) < 1 || (sizeBytes as number) > MAX_ATTACHMENT_BYTES) invalid(`files[${index}].sizeBytes debe estar entre 1 y ${MAX_ATTACHMENT_BYTES}.`);
    if (!Number.isInteger(width) || (width as number) < 1 || (width as number) > 10000) invalid(`files[${index}].width es inválido.`);
    if (!Number.isInteger(height) || (height as number) < 1 || (height as number) > 10000) invalid(`files[${index}].height es inválido.`);
    keys.add(key);
    return { key, title: title.trim(), fileName, contentType: contentType as TlozAttachmentFile["contentType"], sizeBytes: sizeBytes as number, width: width as number, height: height as number };
  });
  return { groupKey, sourceRevision, files: normalized };
}

export function attachmentStoragePath(missionId: string, groupKey: string, key: string, contentType: TlozAttachmentFile["contentType"]): string {
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return `missions/${missionId}/${groupKey}/${key}/${crypto.randomUUID()}.${extension}`;
}

function requireStorageConfig() {
  const baseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceRoleKey) throw new TlozAttachmentRequestError("ATTACHMENT_STORAGE_NOT_CONFIGURED", "El almacenamiento privado de capturas no está configurado.");
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceRoleKey };
}

async function storageRequest(path: string, init: RequestInit = {}) {
  const { baseUrl, serviceRoleKey } = requireStorageConfig();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);
  headers.set("apikey", serviceRoleKey);
  headers.set("Accept", "application/json");
  const response = await fetch(`${baseUrl}/storage/v1${path}`, { ...init, headers });
  if (!response.ok) throw new TlozAttachmentRequestError("ATTACHMENT_STORAGE_ERROR", `Storage respondió HTTP ${response.status}.`);
  return response;
}

function signedUrl(baseUrl: string, value: string, token?: string) {
  const url = new URL(value, `${baseUrl}/storage/v1/`);
  if (url.origin === baseUrl && !url.pathname.startsWith("/storage/v1/")) {
    url.pathname = `/storage/v1${url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`}`;
  }
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

export function createTlozAttachmentStorage(): AttachmentStorage {
  return {
    async createSignedUpload(path, contentType) {
      const { baseUrl } = requireStorageConfig();
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const response = await storageRequest(`/object/upload/sign/${encodeURIComponent(TLOZ_ATTACHMENTS_BUCKET)}/${encodedPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType }),
      });
      const body = await response.json() as { url?: string; token?: string };
      if (!body.url) throw new TlozAttachmentRequestError("ATTACHMENT_STORAGE_ERROR", "Storage no devolvió una URL firmada de carga.");
      return { uploadUrl: signedUrl(baseUrl, body.url, body.token) };
    },
    async inspectObject(path) {
      const { baseUrl } = requireStorageConfig();
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const { serviceRoleKey } = requireStorageConfig();
      const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(TLOZ_ATTACHMENTS_BUCKET)}/${encodedPath}`, { method: "HEAD", headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey } });
      if (response.status === 404) return null;
      if (!response.ok) throw new TlozAttachmentRequestError("ATTACHMENT_STORAGE_ERROR", `Storage respondió HTTP ${response.status}.`);
      return { contentType: response.headers.get("content-type")?.split(";", 1)[0] ?? "", sizeBytes: Number(response.headers.get("content-length") ?? "0") };
    },
    async createSignedRead(path, expiresInSeconds) {
      const { baseUrl } = requireStorageConfig();
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const response = await storageRequest(`/object/sign/${encodeURIComponent(TLOZ_ATTACHMENTS_BUCKET)}/${encodedPath}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: expiresInSeconds }) });
      const body = await response.json() as { signedURL?: string };
      if (!body.signedURL) throw new TlozAttachmentRequestError("ATTACHMENT_STORAGE_ERROR", "Storage no devolvió una URL de lectura firmada.");
      return signedUrl(baseUrl, body.signedURL);
    },
    async removeObject(path) {
      await storageRequest(`/object/${encodeURIComponent(TLOZ_ATTACHMENTS_BUCKET)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [path] }) });
    },
  };
}

let storage: AttachmentStorage | undefined;
export function getTlozAttachmentStorage() {
  storage ??= createTlozAttachmentStorage();
  return storage;
}
