import Link from "next/link";
import { TlozPageShell } from "../../../components/tloz/tloz-shell";
import { getTlozMissions, getTlozProjects } from "../../../lib/tloz-data";
import { resolveMissionIcon } from "../../../components/tloz/tloz-utils";

const statusLabel: Record<string, string> = { planned: "Planeado", active: "Activo", completed: "Completado", blocked: "Bloqueado", archived: "Archivado" };
const statusBg: Record<string, string> = { planned: "#EEF2FF", active: "#E6F4EA", completed: "#F0EFED", blocked: "#FDECEC", archived: "#F0F0F0" };
const statusText: Record<string, string> = { planned: "#2D6CDF", active: "#1E6B3C", completed: "#6B6B6B", blocked: "#B91C22", archived: "#6B6B6B" };

export default async function ProjectsPage() {
  const [projects, missions] = await Promise.all([
    getTlozProjects(),
    getTlozMissions(),
  ]);

  return (
    <TlozPageShell title="Missions" detailLabel="Proyectos">
      <div className="px-6 py-6">
        <div className="overflow-hidden rounded-xl border border-carbon/10 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-carbon/6 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-carbon/55">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Misiones</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const Icon = resolveMissionIcon(project.icon);
                const projectMissions = missions.filter((m) => m.projectId === project.id);
                return (
                  <tr key={project.id} className="tloz-trow cursor-pointer border-b border-carbon/6 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/tloz/projects/${project.id}`} className="inline-flex items-center gap-2.5 font-semibold text-carbon no-underline">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg text-carbon/60 [&_svg]:size-3.5" style={{ background: `${project.color}18`, color: project.color }}><Icon aria-hidden="true" /></span>
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-[9px] py-[3px] text-[11px] font-bold" style={{ background: statusBg[project.status], color: statusText[project.status] }}>{statusLabel[project.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] text-carbon/60">{projectMissions.length}</span>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-carbon/40">No hay proyectos.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </TlozPageShell>
  );
}
