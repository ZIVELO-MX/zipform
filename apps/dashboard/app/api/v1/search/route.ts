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
  type GlobalSearchResult,
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
        : Promise.resolve({ data: [] as TlozDocument[], nextCursor: null as string | null }),
      includeResources
        ? dataClient.tloz.findResources({ query }, { limit, cursor: cursor.resources })
        : Promise.resolve({ data: [] as TlozResource[], nextCursor: null as string | null }),
    ]);
    const owners = await Promise.all(resourcesPage.data.map(async (resource) => {
      const ownerReference = resource.missionId ?? resource.projectId ?? resource.questItemId;
      return ownerReference ? dataClient.canonicalDocuments.get(ownerReference) : null;
    }));

    const results: GlobalSearchResult[] = [];
    let budget = limit;
    let documentsCursor: string | null | undefined = cursor.documents;
    let resourcesCursor: string | null | undefined = cursor.resources;

    let documentIndex = 0;
    for (; documentIndex < documentsPage.data.length && budget > 0; documentIndex++) {
      const document = documentsPage.data[documentIndex];
      documentsCursor = document.id;
      if (requestedTypes.length === 0 || requestedTypes.includes(document.kind)) {
        results.push(documentResult(document));
        budget -= 1;
      }
    }
    const documentsConsumed = !includeDocuments || documentIndex >= documentsPage.data.length;
    if (documentsConsumed && documentsPage.nextCursor) documentsCursor = documentsPage.nextCursor;

    let resourceIndex = 0;
    if (includeResources && budget > 0) {
      for (; resourceIndex < resourcesPage.data.length && budget > 0; resourceIndex++) {
        const resource = resourcesPage.data[resourceIndex];
        resourcesCursor = resource.id;
        const owner = owners[resourceIndex];
        if (owner) {
          results.push(resourceResult(resource, owner));
          budget -= 1;
        }
      }
    }
    const resourcesConsumed = !includeResources || resourceIndex >= resourcesPage.data.length;
    if (resourcesConsumed && resourcesPage.nextCursor) resourcesCursor = resourcesPage.nextCursor;

    const documentsMore = includeDocuments && (documentsConsumed ? Boolean(documentsPage.nextCursor) : documentsPage.data.length > 0);
    const resourcesMore = includeResources && (resourcesConsumed ? Boolean(resourcesPage.nextCursor) : resourcesPage.data.length > 0);

    const nextCursor = documentsMore || resourcesMore
      ? encodeSearchCursor({ documents: documentsCursor, resources: resourcesCursor })
      : null;
    return NextResponse.json({ data: results, nextCursor });
  } catch (error) {
    const paginationResponse = paginationErrorResponse(error);
    if (paginationResponse) return paginationResponse;
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
