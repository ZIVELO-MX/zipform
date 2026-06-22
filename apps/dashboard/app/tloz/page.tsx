import { Map } from "lucide-react";
import { EmptyModule, PageHeader } from "../../components/app-shell";
import { dataClient } from "../../lib/data";

export default async function TlozPage() {
  const app = await dataClient.apps.getById("tloz");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Application Section"
        title="TLOZ"
        description="The dashboard exposes platform support for TLOZ without defining missions, gameplay, workflows, or product behavior."
      />
      <EmptyModule
        icon={<Map size={28} />}
        title="TLOZ platform entry"
        description={app?.description ?? "TLOZ product logic belongs to its dedicated roadmap and implementation process."}
      />
    </div>
  );
}
