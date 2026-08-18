import type { TlozDocument, TlozResource } from "@tloz/types";

export type GlobalSearchType = "project" | "mission" | "inventory" | "resource";

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchType;
  title: string;
  context: string;
  destination: string;
  publicId?: string;
};

export function documentDestination(document: TlozDocument): string {
  if (document.projectSlug === "workshop" || document.projectSlug === "library") {
    return `/${document.projectSlug}/${encodeURIComponent(document.publicId)}`;
  }
  if (document.kind === "mission") {
    return `/${encodeURIComponent(document.projectSlug ?? "tloz")}/${encodeURIComponent(document.publicId)}`;
  }
  if (document.kind === "inventory") return `/inventory/${encodeURIComponent(document.publicId)}`;
  return `/projects/${encodeURIComponent(document.publicId)}`;
}

export function documentContext(document: TlozDocument): string {
  if (document.projectSlug === "workshop") return "Workshop";
  if (document.projectSlug === "library") return "Library";
  if (document.kind === "mission") return document.projectSlug ? `Mission · ${document.projectSlug}` : "Mission";
  if (document.kind === "inventory") return "Inventory";
  return "Projects";
}

export function documentResult(document: TlozDocument): GlobalSearchResult {
  return {
    id: document.id,
    type: document.kind,
    title: document.title,
    context: documentContext(document),
    destination: documentDestination(document),
    publicId: document.publicId,
  };
}

export function resourceResult(resource: TlozResource, owner: TlozDocument): GlobalSearchResult {
  return {
    id: resource.id,
    type: "resource",
    title: resource.title,
    context: `Recurso · ${owner.title}`,
    destination: documentDestination(owner),
  };
}

export function encodeSearchCursor(value: { documents?: string | null; resources?: string | null }): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeSearchCursor(value: string | null): { documents?: string; resources?: string } {
  if (!value) return {};
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (!decoded || typeof decoded !== "object") throw new Error("invalid");
    const candidate = decoded as Record<string, unknown>;
    if (candidate.documents !== undefined && typeof candidate.documents !== "string") throw new Error("invalid");
    if (candidate.resources !== undefined && typeof candidate.resources !== "string") throw new Error("invalid");
    return { documents: candidate.documents as string | undefined, resources: candidate.resources as string | undefined };
  } catch {
    throw new Error("INVALID_SEARCH_CURSOR");
  }
}
