import { dataClient } from "../../lib/data";
import { PageHeader } from "../../components/app-shell";

export default async function RoadmapPage() {
  const roadmap = await dataClient.roadmap.getSnapshot();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`Current ${roadmap.currentVersion} -> Target ${roadmap.targetVersion}`}
        title="Zipform roadmap"
        description="The active platform roadmap follows the NOW / NEXT / LATER structure defined by IDEA.md."
      />
      <section className="roadmap-board">
        <Lane title="NOW" tasks={roadmap.now} />
        <Lane title="NEXT" tasks={roadmap.next} />
        <Lane title="LATER" tasks={roadmap.later} />
      </section>
    </div>
  );
}

function Lane({ title, tasks }: { title: string; tasks: Awaited<ReturnType<typeof dataClient.roadmap.getSnapshot>>["now"] }) {
  return (
    <article className="roadmap-lane">
      <h3>{title}</h3>
      <div className="task-stack">
        {tasks.map((task) => (
          <div className="task-card" key={task.id}>
            <span>{task.category ?? task.app}</span>
            <strong>
              [{task.app}] {task.label}
            </strong>
            {task.dependsOn?.length ? <p>Depends on: {task.dependsOn.join(", ")}</p> : null}
          </div>
        ))}
      </div>
    </article>
  );
}
