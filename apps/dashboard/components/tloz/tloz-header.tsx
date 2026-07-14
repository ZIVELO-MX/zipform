"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  FolderKanban,
  Menu,
  PackageOpen,
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
  Command,
  CommandDialog,
} from "@zipform/ui";
import type { TlozMissionType } from "@zipform/types";
import { missionTypeTone, resolveMissionIcon } from "./tloz-utils";
import { TlozControl } from "./tloz-control";

type TlozHeaderProps = {
  title: string;
  projectLabel?: string;
  detailLabel?: string;
  breadcrumb?: Array<string | { label: string; href: string }>;
  showSearch?: boolean;
  showHeader?: boolean;
  commandEntities: {
    missions: Array<{ id: string; label: string; icon: string; type: TlozMissionType; href: string }>;
    projects: Array<{ id: string; label: string; icon: string; href: string }>;
    questItems: Array<{ id: string; label: string; icon: string; href: string }>;
  };
};

const commandGroups = [
  {
    heading: "Acciones",
    items: [
      { label: "Abrir Inventory", href: "/tloz/inventory", icon: PackageOpen, keywords: "inventory inventario items" },
      { label: "Abrir Projects", href: "/tloz/projects", icon: FolderKanban, keywords: "proyectos projects" },
    ],
  },
  {
    heading: "Navegación",
    items: [
      { label: "Lobby", href: "/tloz", icon: Sword, keywords: "lobby missions misiones" },
    ],
  },
];

export function TlozHeader({ title, projectLabel, detailLabel, breadcrumb, showSearch = true, showHeader = true, commandEntities }: TlozHeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleOpen() { setCommandOpen(true); }
    window.addEventListener("open-command", handleOpen);

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-command", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!showHeader) return null;

  function runCommand(href: string) {
    setCommandOpen(false);
    router.push(href);
  }

  const segments = breadcrumb ?? [projectLabel, detailLabel].filter((value): value is string => Boolean(value));

  return (
    <>
      <header className="tloz-main-header">
        <div className="tloz-header-leading">
          <button
            type="button"
            className="mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/5 md:hidden"
            aria-label="Abrir menú"
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-menu"))}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          {segments.length ? (
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap text-carbon/60">
                {segments.map((segment, index) => {
                  const label = typeof segment === "string" ? segment : segment.label;
                  return <Fragment key={`${label}-${index}`}>
                    {index > 0 ? <BreadcrumbSeparator /> : null}
                    <BreadcrumbItem className={`min-w-0 ${index > 1 ? "hidden md:flex" : ""}`}>
                      {typeof segment === "string" ? <BreadcrumbPage className="truncate">{label}</BreadcrumbPage> : <BreadcrumbLink asChild><Link className="truncate" href={segment.href}>{label}</Link></BreadcrumbLink>}
                    </BreadcrumbItem>
                  </Fragment>;
                })}
              </BreadcrumbList>
            </Breadcrumb>
          ) : null}
        </div>

        <div className="hidden md:flex flex-1 justify-center">
          <button
            type="button"
            className="tloz-command-trigger"
            onClick={() => setCommandOpen(true)}
          >
            <Search size={14} aria-hidden="true" />
            <span>Buscar misiones, proyectos e inventario...</span>
            <kbd>⌘K</kbd>
          </button>
        </div>

        <div className="tloz-header-trailing">
          <TlozControl />
        </div>
      </header>

      <CommandDialog
        className="tloz-command-dialog"
        label="Buscar y ejecutar comandos"
        open={commandOpen}
        onOpenChange={setCommandOpen}
      >
        <div className="tloz-command-input-wrap">
          <Search aria-hidden="true" />
          <Command.Input autoFocus placeholder="Buscar misiones, proyectos e inventario..." />
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
              <Command.Item key={mission.id} value={`Misión ${mission.label}`} onSelect={() => runCommand(mission.href)}>
                <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ color: missionTypeTone[mission.type], backgroundColor: missionTypeBackground[mission.type] }}><MissionIcon aria-hidden="true" /></span>
                <span>{mission.label}</span>
              </Command.Item>
            ); })}
          </Command.Group>
          <Command.Group heading="Proyectos">
            {commandEntities.projects.map((project) => (
              <Command.Item key={project.id} value={`Proyecto ${project.label}`} onSelect={() => runCommand(project.href)}>
                <FolderKanban aria-hidden="true" />
                <span>{project.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Inventory">
            {commandEntities.questItems.map((questItem) => (
              <Command.Item key={questItem.id} value={`Inventory ${questItem.label}`} onSelect={() => runCommand(questItem.href)}>
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
