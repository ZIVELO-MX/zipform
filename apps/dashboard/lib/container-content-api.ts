import {
  ContainerContentError,
  type ContainerContentData,
  type ContainerContentStore,
  type ContentUpdate,
} from "@tloz/data";
import type { ContainerRecord, ContentRecord } from "@tloz/types";
import { NextResponse } from "next/server";

export function revisionEtag(revision: number) {
  return `"${revision}"`;
}

export function parseExpectedRevision(request: Request): number | Response {
  const value = request.headers.get("if-match");
  if (!value) return errorResponse("PRECONDITION_REQUIRED", "If-Match es obligatorio.", 428);
  const revision = Number(value.replace(/^W\//, "").replace(/^"|"$/g, ""));
  if (!Number.isInteger(revision) || revision < 1) return errorResponse("INVALID_REQUEST", "If-Match no contiene una revisión válida.", 400);
  return revision;
}

export function responseFor<T extends ContainerRecord | ContentRecord>(request: Request, record: T) {
  if (request.headers.get("accept")?.includes("text/markdown")) {
    return new Response(record.body, {
      headers: { ETag: revisionEtag(record.revision), "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }
  return NextResponse.json({ data: record }, { headers: { ETag: revisionEtag(record.revision), "Cache-Control": "private, no-store" } });
}

export function errorResponse(code: string, message: string, status: number, fields?: Record<string, string>) {
  return NextResponse.json({ error: { code, message, ...(fields && Object.keys(fields).length ? { fields } : {}), requestId: crypto.randomUUID() } }, { status });
}

export function handleContainerContentError(error: unknown) {
  if (error instanceof ContainerContentError) {
    const status = error.code === "STORE_NOT_FOUND" ? 404 : error.code === "STORE_REVISION_CONFLICT" ? 409 : error.code === "STORE_UNAVAILABLE" ? 503 : 400;
    return errorResponse(error.code, error.message, status, error.fields);
  }
  return errorResponse("INTERNAL_ERROR", "Error interno del servidor.", 500);
}

export async function resolveContainer(store: ContainerContentStore, reference: string) {
  return store.getContainer(reference);
}

export async function resolveContent(store: ContainerContentStore, reference: string) {
  return store.getContent(reference);
}

export function readData(value: unknown): Record<string, ContainerContentData> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContainerContentError("STORE_INVALID", "data debe ser un objeto.", { data: "invalid" });
  return value as Record<string, ContainerContentData>;
}

export function readUpdate(value: unknown): ContentUpdate {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContainerContentError("STORE_INVALID", "El cuerpo JSON debe ser un objeto.");
  const allowed = new Set(["title", "summary", "body", "presentation", "data"]);
  const raw = value as Record<string, unknown>;
  if (Object.keys(raw).some((key) => !allowed.has(key))) throw new ContainerContentError("STORE_INVALID", "El cuerpo contiene campos no soportados.");
  if (raw.data !== undefined) readData(raw.data);
  return raw as ContentUpdate;
}
