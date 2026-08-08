import { dataClient, TlozDocumentError } from "@tloz/data";
import { authenticateRequest } from "../../../../../../../lib/api-auth";
import {
  authorizeDocumentOperation,
  handleDocumentError,
} from "../../../../../../../lib/document-api";

type RouteContext = { params: Promise<{ documentId: string; resourceId: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { documentId, resourceId } = await params;
  try {
    const document = await dataClient.canonicalDocuments.get(documentId);
    if (!document) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
    if (!document.source) {
      throw new TlozDocumentError("DOCUMENT_INVALID", "El documento no admite recursos durante la compatibilidad v1.");
    }
    const forbidden = authorizeDocumentOperation(auth.user, document);
    if (forbidden) return forbidden;
    const resources = await dataClient.tloz.findResources(
      document.kind === "mission"
        ? { missionId: document.source.id }
        : document.kind === "project"
          ? { projectId: document.source.id }
          : { questItemId: document.source.id },
      { limit: 100 },
    );
    if (!resources.data.some((resource) => resource.id === resourceId)) {
      throw new TlozDocumentError("DOCUMENT_NOT_FOUND", `El recurso ${resourceId} no existe.`);
    }
    if (document.kind === "mission") {
      await dataClient.tloz.removeMissionResource(document.source.id, resourceId);
    } else if (document.kind === "project") {
      await dataClient.tloz.removeProjectResource(document.source.id, resourceId);
    } else {
      await dataClient.tloz.removeQuestItemResource(document.source.id, resourceId);
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleDocumentError(error);
  }
}
