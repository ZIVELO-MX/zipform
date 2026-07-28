import { DocumentCollectionPage } from "../../components/tloz/document-collection-page";

export default async function InventoryPage() {
  return (
    <DocumentCollectionPage
      definitionKey="inventory"
      kind="inventory"
      title="Inventory"
      createKind="inventory"
    />
  );
}
