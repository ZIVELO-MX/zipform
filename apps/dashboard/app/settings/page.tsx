import { Settings } from "lucide-react";
import { EmptyModule, PageHeader } from "@zipform/ui";

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Plataforma"
        title="Configuración"
        description="Las opciones de cuenta, espacio de trabajo y plataforma se conectarán cuando existan autenticación y permisos."
      />
      <EmptyModule
        icon={<Settings size={28} />}
        title="Configuración pendiente"
        description="La UI está presente para que la navegación, las acciones de perfil y los futuros controles de cuenta tengan un destino estable."
      />
    </div>
  );
}
