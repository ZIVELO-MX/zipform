import { DocumentEntityPage } from "../../../components/tloz/document-entity-page";

export default async function InventoryDocumentPage({
  params,
}: {
  params: Promise<{ inventoryId: string }>;
}) {
  const { inventoryId } = await params;
  return (
    <DocumentEntityPage
      definitionKey="inventory"
      identifier={inventoryId}
      kind="inventory"
    />
  );
}
