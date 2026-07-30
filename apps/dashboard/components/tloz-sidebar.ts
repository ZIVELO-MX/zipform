import { BookOpen, FolderKanban, Lightbulb, LayoutDashboard, PackageOpen } from "lucide-react";
import type { TlozProject } from "@tloz/types";
import type { NavItem, NavSection } from "@tloz/ui";
import { resolveMissionIcon } from "./tloz/tloz-utils";
import { projectHref } from "../lib/tloz-routes";
import { sortProjectsByActivity } from "./project-navigation";

export function buildTlozSections(projects: TlozProject[], projectActiveCounts: Map<string, number>, projectActivity: Map<string, string>): NavSection[] {
  const projectItems: NavItem[] = sortProjectsByActivity(projects, projectActivity).map((project) => {
    const Icon = resolveMissionIcon(project.icon);
    return { label: project.name, href: projectHref(project), icon: Icon, badge: projectActiveCounts.get(project.id) ?? 0 };
  });

  return [
    { items: [{ label: "Lobby", href: "/", icon: LayoutDashboard, exact: true }] },
    {
      label: "Sistema",
      collapsible: true,
      defaultCollapsed: false,
      items: [
        { label: "Inventory", href: "/inventory", icon: PackageOpen },
        { label: "Projects", href: "/projects", icon: FolderKanban },
        { label: "Workshop", href: "/workshop", icon: Lightbulb },
        { label: "Library", href: "/library", icon: BookOpen },
      ],
    },
    ...(projectItems.length > 0 ? [{ label: "Proyectos", collapsible: true, defaultCollapsed: false, visibleItemLimit: 4, items: projectItems } satisfies NavSection] : []),
  ];
}
