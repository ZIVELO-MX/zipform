import Link from "next/link";
import { ArrowUpRight, Database, LockKeyhole, Sparkles } from "lucide-react";
import { dataClient } from "../lib/data";
import { PageHeader } from "@zipform/ui";

export default async function DashboardPage() {
  const [apps, metrics] = await Promise.all([
    dataClient.apps.list(),
    dataClient.platform.getMetrics()
  ]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Versión actual 0.1"
        title="Panel de control Zipform"
        description="Centro de comando funcional para las aplicaciones de Zivelo y la plataforma compartida."
      />

      <section className="metric-grid" aria-label="Métricas de la plataforma">
        {metrics.map((metric) => (
          <article className="metric-card" data-tone={metric.tone} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel app-launcher">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Aplicaciones</p>
              <h3>Lanzador</h3>
            </div>
            <Sparkles size={20} />
          </div>
          <div className="app-card-grid">
            {apps.map((app) => (
              <Link href={app.href} className="app-card" data-status={app.status} key={app.id}>
                <span className="app-card-status">{app.status}</span>
                <strong>{app.name}</strong>
                <p>{app.description}</p>
                <span className="card-link">
                  Abrir sección
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="panel platform-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Base</p>
              <h3>Datos mock hoy, DB real después</h3>
            </div>
            <Database size={20} />
          </div>
          <p>
            El dashboard lee de módulos de repositorio asíncronos a través de un driver mock. Un driver de base de datos
            real puede reemplazar la fuente mock sin cambiar los contratos de las páginas.
          </p>
          <div className="foundation-list">
            <span>
              <Database size={17} />
              Repositorios asíncronos
            </span>
            <span>
              <LockKeyhole size={17} />
              Autenticación planeada
            </span>
          </div>
        </aside>
      </section>
    </div>
  );
}
