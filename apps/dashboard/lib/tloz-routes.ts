import type { TlozProject } from "@zipform/types";

export const TLOZ_VIEWS = ["dashboard", "list", "board", "table", "calendar"] as const;
export type TlozView = (typeof TLOZ_VIEWS)[number];

export function resolveTlozView(preferredView: TlozView, supportedViews: readonly TlozView[], defaultView: TlozView): TlozView {
  return supportedViews.includes(preferredView) ? preferredView : defaultView;
}

export const SYSTEM_PROJECTS = {
  inventory: {
    slug: "inventory",
    type: "system",
    label: "Inventory",
    availableViews: ["table", "list"],
    defaultView: "table",
    detailVariant: "inventory",
    showMissionControls: false,
  },
  projects: {
    slug: "projects",
    type: "system",
    label: "Projects",
    availableViews: ["table", "list"],
    defaultView: "table",
    detailVariant: "project",
    showMissionControls: false,
  },
} as const satisfies Record<string, {
  slug: string;
  type: "system";
  label: string;
  availableViews: readonly TlozView[];
  defaultView: TlozView;
  detailVariant: "inventory" | "project";
  showMissionControls: boolean;
}>;

export type SystemProjectSlug = keyof typeof SYSTEM_PROJECTS;

export function getSystemProject(slug: string) {
  return SYSTEM_PROJECTS[slug as SystemProjectSlug];
}

export function projectSlug(project: Pick<TlozProject, "name" | "slug">): string {
  return project.slug || project.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function findProjectBySlug(projects: TlozProject[], slug: string) {
  return projects.find((project) => project.slug === slug || projectSlug(project) === slug);
}

export function projectHref(project: Pick<TlozProject, "name" | "slug">) {
  return `/tloz/${projectSlug(project)}`;
}

export function missionHref(project: Pick<TlozProject, "name" | "slug">, missionId: string) {
  return `/tloz/${projectSlug(project)}/${missionId}`;
}

export function inventoryItemHref(itemId: string) {
  return `/tloz/inventory/${encodeURIComponent(itemId)}`;
}

export function projectDetailHref(projectId: string) {
  return `/tloz/projects/${encodeURIComponent(projectId)}`;
}
