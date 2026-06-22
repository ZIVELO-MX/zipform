import Link from "next/link";
import { ArrowUpRight, Database, LockKeyhole, Sparkles } from "lucide-react";
import { dataClient } from "../lib/data";
import { PageHeader } from "../components/app-shell";

export default async function DashboardPage() {
  const [apps, roadmap, metrics] = await Promise.all([
    dataClient.apps.list(),
    dataClient.roadmap.getSnapshot(),
    dataClient.platform.getMetrics()
  ]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Current Version 0.1"
        title="Zipform platform dashboard"
        description="A functional command center for Zivelo apps, roadmap status, and the shared platform foundation."
        action={<span className="version-badge">Target {roadmap.targetVersion}</span>}
      />

      <section className="metric-grid" aria-label="Platform metrics">
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
              <p className="eyebrow">Applications</p>
              <h3>Launch surface</h3>
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
                  Open section
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="panel platform-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Foundation</p>
              <h3>Mock data today, DB-ready later</h3>
            </div>
            <Database size={20} />
          </div>
          <p>
            The dashboard reads from async repository modules through a mock driver. A real database driver can replace
            the mock source without changing the page contracts.
          </p>
          <div className="foundation-list">
            <span>
              <Database size={17} />
              Async repositories
            </span>
            <span>
              <LockKeyhole size={17} />
              Auth planned
            </span>
          </div>
        </aside>
      </section>

      <section className="panel roadmap-preview">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Roadmap</p>
            <h3>NOW / NEXT / LATER</h3>
          </div>
          <Link className="text-link" href="/roadmap">
            Full roadmap
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="roadmap-columns">
          <RoadmapColumn title="NOW" tasks={roadmap.now.map((task) => task.label)} />
          <RoadmapColumn title="NEXT" tasks={roadmap.next.slice(0, 4).map((task) => task.label)} />
          <RoadmapColumn title="LATER" tasks={roadmap.later.map((task) => task.label)} />
        </div>
      </section>
    </div>
  );
}

function RoadmapColumn({ title, tasks }: { title: string; tasks: string[] }) {
  return (
    <article className="roadmap-column">
      <h4>{title}</h4>
      <ul>
        {tasks.map((task) => (
          <li key={task}>{task}</li>
        ))}
      </ul>
    </article>
  );
}
