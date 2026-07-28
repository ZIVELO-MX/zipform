import type { TlozDocument, TlozDocumentKind } from "@tloz/types";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getTlozDocument,
  getTlozDocumentDefinition,
  getTlozDocuments,
  getTlozUsers,
} from "../../lib/tloz-data";
import { DocumentEntityView } from "./document-view-renderer";
import { TlozPageShell } from "./tloz-shell";

export async function DocumentEntityPage({
  definitionKey,
  identifier,
  kind,
}: {
  definitionKey: string;
  identifier: string;
  kind: Extract<TlozDocumentKind, "project" | "inventory">;
}) {
  const documentPromise = resolveDocument(identifier, kind);
  const [resolvedDocument, definition, users] = await Promise.all([
    documentPromise,
    getTlozDocumentDefinition(definitionKey),
    getTlozUsers(),
  ]);
  if (!resolvedDocument || !definition || definition.kind !== kind) notFound();
  if (identifier !== resolvedDocument.publicId) {
    permanentRedirect(
      kind === "project"
        ? `/projects/${encodeURIComponent(resolvedDocument.publicId)}`
        : `/inventory/${encodeURIComponent(resolvedDocument.publicId)}`,
    );
  }
  const document = resolvedDocument.children
    ? {
      ...resolvedDocument,
      properties: {
        ...resolvedDocument.properties,
        mission_count: resolvedDocument.children.total,
      },
    }
    : resolvedDocument;

  return (
    <TlozPageShell
      title={document.title}
      showHeader={false}
      showSearch={false}
      missionControls={false}
      createKind={kind}
      documentNavigation={{ documents: [document], users }}
    >
      <div className="min-h-full bg-[#FAFAF9]">
        <DocumentEntityView
          document={document}
          definition={definition}
          users={users}
        />
      </div>
    </TlozPageShell>
  );
}

async function resolveDocument(
  identifier: string,
  kind: "project" | "inventory",
): Promise<TlozDocument | null> {
  const direct = await getTlozDocument(identifier, {
    includeChildren: kind === "project",
    childrenPagination: { limit: 1 },
  });
  if (direct?.kind === kind) return direct;
  if (kind !== "project") return null;

  const projects = await getTlozDocuments("project");
  const alias = projects.data.find((document) => document.projectSlug === identifier);
  if (!alias) return null;
  return getTlozDocument(alias.id, {
    includeChildren: true,
    childrenPagination: { limit: 1 },
  });
}
