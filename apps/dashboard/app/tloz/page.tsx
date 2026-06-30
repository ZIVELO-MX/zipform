import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { DashboardClient } from "./dashboard-client";
import { getTlozDashboardSummary } from "../../lib/tloz-data";
import { Suspense } from "react";
import { TlozLoading } from "../../components/tloz/tloz-loading";

async function DashboardData() {
  const summary = await getTlozDashboardSummary();
  return <DashboardClient summary={summary} />;
}

export default function TlozPage() {
  return (
    <TlozPageShell
      title="Dashboard"
      description="Visión general del equipo · trabajo activo en todos los proyectos · 4 personas"
      currentView="Dashboard"
      showSearch={true}
      showHeader={true}
    >
      <Suspense fallback={<TlozLoading />}>
        <DashboardData />
      </Suspense>
    </TlozPageShell>
  );
}
