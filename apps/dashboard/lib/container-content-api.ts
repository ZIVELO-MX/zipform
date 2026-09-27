import {
  ContainerContentError,
  type ContainerContentData,
  type ContainerContentStore,
  type ContentUpdate,
} from "@tloz/data";
import type { ContainerDefinition, ContainerRecord, ContentRecord } from "@tloz/types";
import { NextResponse } from "next/server";
import { errorResponse, parseExpectedRevision, revisionEtag } from "./api-response";
import { paginationErrorResponse } from "./api-pagination";

export { errorResponse, parseExpectedRevision, revisionEtag } from "./api-response";

export function responseFor<T extends ContainerRecord | ContentRecord>(request: Request, record: T) {
  if (request.headers.get("accept")?.includes("text/markdown")) {
    return new Response(record.body, {
      headers: { ETag: revisionEtag(record.revision), "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "private, no-store", Vary: "Accept" },
    });
  }
  return NextResponse.json({ data: record }, { headers: { ETag: revisionEtag(record.revision), "Cache-Control": "private, no-store", Vary: "Accept" } });
}

export function handleContainerContentError(error: unknown) {
  const paginationResponse = paginationErrorResponse(error);
  if (paginationResponse) return paginationResponse;
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

export function readDefinition(value: unknown): ContainerDefinition {
  const invalid = (message: string) => new ContainerContentError("STORE_INVALID", message, { definition: "invalid" });
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid("definition debe ser un objeto.");
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.fields)) throw invalid("definition.fields debe ser una lista.");
  if (!Array.isArray(raw.views)) throw invalid("definition.views debe ser una lista.");
  if (typeof raw.defaultView !== "string" || !raw.defaultView) throw invalid("definition.defaultView debe ser un identificador.");
  if (raw.fields.some((field) => !field || typeof field !== "object" || typeof (field as { key?: unknown }).key !== "string")) {
    throw invalid("Cada campo de definition.fields necesita una clave.");
  }
  if (raw.views.some((view) => !view || typeof view !== "object" || typeof (view as { id?: unknown }).id !== "string" || !Array.isArray((view as { fields?: unknown }).fields))) {
    throw invalid("Cada vista de definition.views necesita id y fields.");
  }
  return value as ContainerDefinition;
}

export function readUpdate(value: unknown): ContentUpdate {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContainerContentError("STORE_INVALID", "El cuerpo JSON debe ser un objeto.");
  const allowed = new Set(["title", "summary", "body", "presentation", "data"]);
  const raw = value as Record<string, unknown>;
  if (Object.keys(raw).some((key) => !allowed.has(key))) throw new ContainerContentError("STORE_INVALID", "El cuerpo contiene campos no soportados.");
  if (raw.data !== undefined) readData(raw.data);
  return raw as ContentUpdate;
}
