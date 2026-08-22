import { NextRequest, NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import type { TlozDocument, TlozDocumentKind, TlozResource } from "@tloz/types";
import { authenticateRequest } from "../../../../lib/api-auth";
import { paginationErrorResponse, parsePaginationLimit } from "../../../../lib/api-pagination";
import {
  decodeSearchCursor,
  documentResult,
  resourceResult,
  encodeSearchCursor,
  type GlobalSearchType,
} from "../../../../lib/global-search";

const VALID_TYPES = new Set<GlobalSearchType>(["project", "mission", "inventory", "resource"]);
const DOCUMENT_KINDS: TlozDocumentKind[] = ["project", "mission", "inventory"];

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ data: [], nextCursor: null });
  if (query.length < 2) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "q debe tener al menos 2 caracteres.", requestId: crypto.randomUUID() } }, { status: 400 });
  }

  const requestedTypes = (searchParams.get("types")?.split(",").map((value) => value.trim()).filter(Boolean) ?? []) as GlobalSearchType[];
  if (requestedTypes.some((type) => !VALID_TYPES.has(type))) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "types contiene un tipo no soportado.", requestId: crypto.randomUUID() } }, { status: 400 });
  }
  const includeDocuments = requestedTypes.length === 0 || requestedTypes.some((type) => type !== "resource");
  const includeResources = requestedTypes.length === 0 || requestedTypes.includes("resource");
  const limit = parsePaginationLimit(searchParams.get("limit"));
  if (limit instanceof Response) return limit;

  let cursor: { documents?: string; resources?: string };
  try {
    cursor = decodeSearchCursor(searchParams.get("cursor"));
  } catch {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "cursor no es válido.", fields: { cursor: "invalid" }, requestId: crypto.randomUUID() } }, { status: 400 });
  }

  try {
    const [documentsPage, resourcesPage] = await Promise.all([
      includeDocuments
        ? dataClient.canonicalDocuments.find({ query, includeSystem: false }, { limit, cursor: cursor.documents })
        : Promise.resolve({ data: [] as TlozDocument[], nextCursor: null }),
      includeResources
        ? dataClient.tloz.findResources({ query }, { limit, cursor: cursor.resources })
        : Promise.resolve({ data: [] as TlozResource[], nextCursor: null }),
    ]);

    const documents = documentsPage.data.filter((document) => requestedTypes.length === 0 || requestedTypes.includes(document.kind));
    const resourceResults = await Promise.all(resourcesPage.data.map(async (resource) => {
      const ownerReference = resource.missionId ?? resource.projectId ?? resource.questItemId;
      if (!ownerReference) return null;
      const owner = await dataClient.canonicalDocuments.get(ownerReference);
      return owner ? resourceResult(resource, owner) : null;
    }));
    const results = [
      ...documents.map(documentResult),
      ...resourceResults.filter((result): result is NonNullable<typeof result> => Boolean(result)),
    ].slice(0, limit);

    const nextCursor = documentsPage.nextCursor || resourcesPage.nextCursor
      ? encodeSearchCursor({ documents: documentsPage.nextCursor, resources: resourcesPage.nextCursor })
      : null;
    return NextResponse.json({ data: results, nextCursor });
  } catch (error) {
    const paginationResponse = paginationErrorResponse(error);
    if (paginationResponse) return paginationResponse;
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
