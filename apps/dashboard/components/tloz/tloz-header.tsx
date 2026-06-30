"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  PackageOpen,
  PanelLeft,
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
} from "@zipform/ui";
import { useAppSidebar } from "../app-shell";

type TlozHeaderProps = {
  title: string;
  currentView?: string;
  detailLabel?: string;
  showSearch?: boolean;
  showHeader?: boolean;
  commandEntities: {
    missions: Array<{ id: string; label: string }>;
    projects: Array<{ id: string; label: string }>;
    questItems: Array<{ id: string; label: string }>;
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
      { label: "Dashboard", href: "/tloz", icon: LayoutDashboard, keywords: "inicio resumen" },
      { label: "Missions", href: "/tloz/board", icon: Sword, keywords: "misiones missions board" },
      { label: "Projects", href: "/tloz#projects", icon: FolderKanban, keywords: "proyectos projects" },
      { label: "Quest items", href: "/tloz#quest-items", icon: ListTodo, keywords: "quest items tareas" },
    ],
  },
];

export function TlozHeader({ title, currentView, detailLabel, showSearch = true, showHeader = true, commandEntities }: TlozHeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const { toggleSidebar } = useAppSidebar();
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
          <Button variant="ghost" size="icon" type="button" aria-label="Alternar barra lateral" onClick={toggleSidebar}>
            <PanelLeft aria-hidden="true" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap text-carbon/60">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/tloz">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{currentView || title}</BreadcrumbPage>
              </BreadcrumbItem>
              {detailLabel ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate">{detailLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
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
      </header>

      <Command.Dialog
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
            {commandEntities.missions.map((mission) => (
              <Command.Item key={mission.id} value={`Misión ${mission.label}`} onSelect={() => runCommand(`/tloz/missions/${mission.id}`)}>
                <Sword aria-hidden="true" />
                <span>{mission.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Proyectos">
            {commandEntities.projects.map((project) => (
              <Command.Item key={project.id} value={`Proyecto ${project.label}`} onSelect={() => runCommand(`/tloz?project=${project.id}#projects`)}>
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
      </Command.Dialog>
    </>
  );
}
