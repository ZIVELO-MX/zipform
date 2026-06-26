import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { DashboardClient } from "./dashboard-client";
import { getTlozDashboardSummary } from "../../lib/tloz-data";

export default async function TlozPage() {
  const summary = await getTlozDashboardSummary();

  return (
    <TlozPageShell
      title="Dashboard"
      description="Visión general del equipo · trabajo activo en todos los proyectos · 4 personas"
      currentView="Dashboard"
      showSearch={true}
      showHeader={true}
    >
      <DashboardClient summary={summary} />
    </TlozPageShell>
  );
}
