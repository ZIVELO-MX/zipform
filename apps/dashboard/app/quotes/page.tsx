import { FileText } from "lucide-react";
import { EmptyModule, PageHeader } from "../../components/app-shell";
import { dataClient } from "../../lib/data";

export default async function QuotesPage() {
  const app = await dataClient.apps.getById("quotes");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Application Section"
        title="Quotes"
        description="A platform section for the existing quote product. Business functionality is intentionally not implemented in this dashboard phase."
      />
      <EmptyModule
        icon={<FileText size={28} />}
        title="Quotes integration placeholder"
        description={
          app?.description ??
          "Quotes will connect to the shared platform after the current product workflow is audited."
        }
      />
    </div>
  );
}
