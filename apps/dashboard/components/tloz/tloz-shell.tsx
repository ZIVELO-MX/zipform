import { PageSubHeader, SegmentedControl } from "@zipform/ui";
import { getTlozMissions, getTlozProjects, getTlozQuestItems } from "../../lib/tloz-data";
import { TlozHeader } from "./tloz-header";

type TlozPageShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  detailLabel?: string;
  showSearch?: boolean;
  showDisplaySwitcher?: boolean;
  showHeader?: boolean;
  fullWidth?: boolean;
};

export async function TlozPageShell({
  title,
  description,
  detailLabel,
  showSearch = true,
  showDisplaySwitcher = false,
  showHeader = true,
  fullWidth = false,
  children
}: TlozPageShellProps) {
  const [missions, projects, questItems] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozQuestItems(),
  ]);

  return (
    <div className={fullWidth ? "tloz-page-full" : "page-stack tloz-page"}>
      <TlozHeader
        title={title}
        detailLabel={detailLabel}
        showSearch={showSearch}
        showDisplaySwitcher={showDisplaySwitcher}
        showHeader={showHeader}
        commandEntities={{
          missions: missions.map((mission) => ({ id: mission.id, label: mission.title, icon: mission.icon, type: mission.type })),
          projects: projects.map((project) => ({ id: project.id, label: project.name, icon: project.icon })),
          questItems: questItems.map((questItem) => ({ id: questItem.id, label: questItem.name, icon: questItem.icon })),
        }}
      />

      <main className="tloz-page-content" id="tloz-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function TlozSubpageHeader({ title, description }: { title: string; description: string }) {
  return <PageSubHeader title={title} description={description} />;
}

export function TlozViewHeader({
  title,
  description,
  children,
  showAudienceToggle = false
}: {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
  showAudienceToggle?: boolean;
}) {
  return (
    <PageSubHeader
      title={title}
      description={description}
      actions={
        <>
          {showAudienceToggle ? (
            <SegmentedControl
              aria-label="Filtrar por audiencia"
              value="team"
              options={[
                { label: "Todo el equipo", value: "team" },
                { label: "Solo yo", value: "me" },
              ]}
            />
          ) : null}
          {children}
        </>
      }
    />
  );
}
