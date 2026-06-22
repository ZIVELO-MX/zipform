import { FileText } from "lucide-react";
import { EmptyModule, PageHeader } from "../../components/app-shell";
import { dataClient } from "../../lib/data";

export default async function QuotesPage() {
  const app = await dataClient.apps.getById("quotes");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Sección de aplicación"
        title="Cotizaciones"
        description="Sección de plataforma para el producto de cotizaciones existente. La funcionalidad de negocio no está implementada en esta fase del dashboard."
      />
      <EmptyModule
        icon={<FileText size={28} />}
        title="Integración de Cotizaciones pendiente"
        description={
          app?.description ??
          "Cotizaciones se conectará a la plataforma compartida después de auditar el flujo de trabajo actual del producto."
        }
      />
    </div>
  );
}
