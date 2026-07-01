"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderKanban,
  ListTodo,
  PackageOpen,
  Plus,
  Search,
  Sword,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Command,
  CommandDialog,
} from "@zipform/ui";
import type { TlozMissionType } from "@zipform/types";
import { missionTypeTone, resolveMissionIcon } from "./tloz-utils";
import { DisplaySwitcher } from "./display-switcher";

type TlozHeaderProps = {
  title: string;
  detailLabel?: string;
  showSearch?: boolean;
  showHeader?: boolean;
  showDisplaySwitcher?: boolean;
  commandEntities: {
    missions: Array<{ id: string; label: string; icon: string; type: TlozMissionType }>;
    projects: Array<{ id: string; label: string; icon: string }>;
    questItems: Array<{ id: string; label: string; icon: string }>;
  };
};

const commandGroups = [
  {
    heading: "Acciones",
    items: [
      { label: "Crear nueva misión", href: "/tloz/board?create=mission", icon: Plus, keywords: "mission misión nueva crear" },
      { label: "Crear quest item", href: "/tloz#quest-items", icon: PackageOpen, keywords: "quest item crear" },
      { label: "Crear proyecto", href: "/tloz#projects", icon: FolderKanban, keywords: "proyecto crear" },
    ],
  },
  {
    heading: "Navegación",
    items: [
      { label: "Missions", href: "/tloz", icon: Sword, keywords: "misiones missions" },
    ],
  },
];

export function TlozHeader({ title, detailLabel, showSearch = true, showHeader = true, showDisplaySwitcher = false, commandEntities }: TlozHeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!showHeader) return null;

  function runCommand(href: string) {
    setCommandOpen(false);
    router.push(href);
  }

  return (
    <>
      <header className="tloz-main-header">
        <div className="tloz-header-leading">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap text-carbon/60">
              {detailLabel ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/tloz">{title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate">{detailLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {showSearch ? (
          <button className="tloz-command-trigger" type="button" onClick={() => setCommandOpen(true)}>
            <Search aria-hidden="true" />
            <span>Buscar misiones, proyectos, quest items...</span>
            <kbd>⌘K / Ctrl+K</kbd>
          </button>
        ) : null}

        {showDisplaySwitcher ? (
          <div className="tloz-header-trailing">
            <DisplaySwitcher />
          </div>
        ) : null}
      </header>

      <CommandDialog
        className="tloz-command-dialog"
        label="Buscar y ejecutar comandos"
        open={commandOpen}
        onOpenChange={setCommandOpen}
      >
        <div className="tloz-command-input-wrap">
          <Search aria-hidden="true" />
          <Command.Input autoFocus placeholder="Buscar misiones, proyectos, quest items..." />
        </div>
        <Command.List>
          <Command.Empty>No se encontraron resultados.</Command.Empty>
          {commandGroups.map((group) => (
            <Command.Group key={group.heading} heading={group.heading}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={`${group.heading}-${item.label}`}
                    keywords={[item.keywords]}
                    value={item.label}
                    onSelect={() => runCommand(item.href)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
          <Command.Group heading="Misiones">
            {commandEntities.missions.map((mission) => { const MissionIcon = resolveMissionIcon(mission.icon); return (
              <Command.Item key={mission.id} value={`Misión ${mission.label}`} onSelect={() => runCommand(`/tloz/missions/${mission.id}`)}>
                <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ color: missionTypeTone[mission.type], backgroundColor: missionTypeBackground[mission.type] }}><MissionIcon aria-hidden="true" /></span>
                <span>{mission.label}</span>
              </Command.Item>
            ); })}
          </Command.Group>
          <Command.Group heading="Proyectos">
            {commandEntities.projects.map((project) => (
              <Command.Item key={project.id} value={`Proyecto ${project.label}`} onSelect={() => runCommand(`/tloz?project=${project.id}`)}>
                <FolderKanban aria-hidden="true" />
                <span>{project.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Quest items">
            {commandEntities.questItems.map((questItem) => (
              <Command.Item key={questItem.id} value={`Quest item ${questItem.label}`} onSelect={() => runCommand(`/tloz?questItem=${questItem.id}#quest-items`)}>
                <PackageOpen aria-hidden="true" />
                <span>{questItem.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </CommandDialog>
    </>
  );
}

const missionTypeBackground: Record<TlozMissionType, string> = { main_quest: "#FDECEC", side_quest: "#EEF2FF", farming_quest: "#E6F4EA", exploration_quest: "#F2EAFE" };
