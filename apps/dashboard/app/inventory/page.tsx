import { DocumentCollectionPage } from "../../components/tloz/document-collection-page";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor } = await searchParams;
  return (
    <DocumentCollectionPage
      definitionKey="inventory"
      kind="inventory"
      title="Inventory"
      createKind="inventory"
      cursor={cursor}
      basePath="/inventory"
    />
  );
}
