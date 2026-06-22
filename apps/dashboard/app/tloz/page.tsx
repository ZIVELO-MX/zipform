import { Sword } from "lucide-react";
import { EmptyModule, PageHeader } from "../../components/app-shell";
import { dataClient } from "../../lib/data";

export default async function TlozPage() {
  const app = await dataClient.apps.getById("tloz");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Sección de aplicación"
        title="TLOZ"
        description="El dashboard expone soporte de plataforma para TLOZ sin definir misiones, jugabilidad, flujos de trabajo ni comportamiento del producto."
      />
      <EmptyModule
        icon={<Sword size={28} />}
        title="Entrada de plataforma TLOZ"
        description={app?.description ?? "La lógica del producto TLOZ pertenece a su propio roadmap y proceso de implementación."}
      />
    </div>
  );
}
