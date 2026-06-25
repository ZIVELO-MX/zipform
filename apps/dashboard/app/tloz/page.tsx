import Link from "next/link";
import { Clock, Star } from "lucide-react";
import { Badge } from "@zipform/ui";
import { ActiveMissionPanel, MissionCard } from "../../components/tloz/mission-card";
import { DashboardMissionList } from "../../components/tloz/mission-views";
import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { getTlozDashboardSummary } from "../../lib/tloz-data";

export default async function TlozPage() {
  const summary = await getTlozDashboardSummary();

  return (
    <TlozPageShell
      title="Dashboard"
      description="Visión general del equipo, trabajo activo en todos los proyectos y próximas Missions."
      currentView="Dashboard"
      showSearch={false}
    >
      <div className="tloz-dashboard-toolbar">
        <div className="tloz-section-title">
          <span className="tloz-now-dot" />
          <h3>En curso ahora · Mi foco</h3>
        </div>
        <span className="tloz-focus-limit">
          <Clock size={13} />
          Límite de foco: <strong>1 Quest + 1 Support</strong> por persona
        </span>
      </div>

      <section className="tloz-active-grid">
        <ActiveMissionPanel label="Quest activa" mission={summary.activeQuest} />
        <ActiveMissionPanel label="Support Quest activa" mission={summary.activeSupportQuest} />
      </section>

      <section className="tloz-section">
        <div className="tloz-section-heading">
          <div className="tloz-section-title">
            <Star size={15} />
            <h3>Main Quests</h3>
            <Badge variant="muted">{summary.mainQuests.length}</Badge>
          </div>
          <Link href="/tloz/list">Ver todas →</Link>
        </div>
        <div className="tloz-main-quest-grid">
          {summary.mainQuests.slice(0, 3).map((mission) => (
            <MissionCard mission={mission} compact key={mission.id} />
          ))}
        </div>
      </section>

      <section className="tloz-two-column">
        <DashboardMissionList
          title="Próximas · Next"
          subtitle="Validadas, esperando capacidad"
          missions={summary.upcomingMissions}
        />
        <DashboardMissionList
          title="Más adelante · Later"
          subtitle="Ideas · sin validar · bloqueadas"
          missions={summary.futureMissions}
        />
      </section>

      <section className="tloz-section" id="projects">
        <div className="tloz-section-heading">
          <div className="tloz-section-title">
            <h3>Proyectos</h3>
            <Badge variant="muted">{summary.projects.length}</Badge>
          </div>
        </div>
        <div className="tloz-project-grid">
          {summary.projects.map((project) => (
            <article className="panel tloz-project-card" key={project.id}>
              <span style={{ backgroundColor: project.color }} />
              <strong>{project.name}</strong>
              <p>{project.description}</p>
              <small>
                {project.nowMissions} Now / {project.completedMissions} Completed / {project.totalMissions} Total
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="tloz-system-anchors" aria-label="Sistema TLOZ">
        <div id="quest-items" />
        <div id="resources" />
      </section>
    </TlozPageShell>
  );
}
