import type { TlozProject } from "@tloz/types";

export const TLOZ_VIEWS = ["dashboard", "list", "board", "table", "calendar", "detail"] as const;
export type TlozView = (typeof TLOZ_VIEWS)[number];

export function resolveTlozView(preferredView: TlozView, supportedViews: readonly TlozView[], defaultView: TlozView): TlozView {
  return supportedViews.includes(preferredView) ? preferredView : defaultView;
}

export const TLOZ_MOBILE_VIEWS = ["list", "table"] as const satisfies readonly TlozView[];

export function resolveResponsiveTlozViews(
  isMobile: boolean,
  supportedViews: readonly TlozView[],
  defaultView: TlozView,
): { views: readonly TlozView[]; defaultView: TlozView } {
  if (!isMobile) return { views: supportedViews, defaultView };

  return {
    views: TLOZ_MOBILE_VIEWS,
    defaultView: TLOZ_MOBILE_VIEWS.includes(defaultView as (typeof TLOZ_MOBILE_VIEWS)[number]) ? defaultView : "list",
  };
}

export const RESERVED_PROJECT_SLUGS = new Set([
  "api",
  "inventory",
  "login",
  "new",
  "projects",
]);

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
  return `/${projectSlug(project)}`;
}

export function missionHref(project: Pick<TlozProject, "name" | "slug">, missionId: string) {
  return `/${projectSlug(project)}/${encodeURIComponent(missionId)}`;
}

export function inventoryItemHref(itemId: string) {
  return `/inventory/${encodeURIComponent(itemId)}`;
}

export function projectDetailHref(project: Pick<TlozProject, "name" | "slug"> & { publicId?: string }) {
  return `/projects/${encodeURIComponent(project.publicId ?? `project-${projectSlug(project)}`)}`;
}

export function projectBreadcrumb(project: Pick<TlozProject, "name" | "slug">) {
  return { label: project.name, href: projectDetailHref(project) };
}
