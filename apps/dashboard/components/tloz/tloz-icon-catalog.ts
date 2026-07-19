import {
  CircleDot, Compass, Copy, Database, File, FileCheck, FileText, Flag, FolderKanban,
  Github, Globe2, History, Image as ImageIcon, KeyRound, LayoutDashboard, Link2,
  PackageOpen, Search, Shield, Sparkles, Star, StickyNote, Sword, Target, Utensils,
  Wrench, type LucideIcon,
} from "lucide-react";
import type { TlozResource, TlozResourceType } from "@zipform/types";
import type { IconPickerOption } from "@zipform/ui";

export const TLOZ_ICON_CATALOG = [
  ["Sword", "Misión", Sword], ["Star", "Main Quest", Star], ["Flag", "Side Quest", Flag],
  ["Compass", "Exploración", Compass], ["CircleDot", "Farming", CircleDot], ["Sparkles", "Destacado", Sparkles],
  ["Target", "Objetivo", Target], ["Search", "Búsqueda", Search], ["Database", "Base de datos", Database],
  ["FileText", "Documento", FileText], ["FileCheck", "Validación", FileCheck], ["File", "Archivo", File],
  ["Image", "Imagen", ImageIcon], ["Link2", "Enlace", Link2], ["StickyNote", "Nota", StickyNote],
  ["Github", "GitHub", Github], ["KeyRound", "Acceso", KeyRound], ["Shield", "Seguridad", Shield],
  ["Wrench", "Herramienta", Wrench], ["FolderKanban", "Proyecto", FolderKanban], ["PackageOpen", "Inventory", PackageOpen],
  ["LayoutDashboard", "Dashboard", LayoutDashboard], ["Globe2", "Web", Globe2], ["History", "Historial", History],
  ["Copy", "Copia", Copy], ["Utensils", "Alimentos", Utensils],
] as const satisfies ReadonlyArray<readonly [string, string, LucideIcon]>;

const iconRegistry = Object.fromEntries(TLOZ_ICON_CATALOG.map(([id, , icon]) => [id, icon])) as Record<string, LucideIcon>;

export const TLOZ_ICON_OPTIONS: IconPickerOption[] = TLOZ_ICON_CATALOG.map(([id, label, icon]) => ({ id, label, icon }));
export const RESOURCE_ICON_OPTIONS = TLOZ_ICON_OPTIONS.filter((option) => ["Link2", "FileText", "File", "Image", "StickyNote", "Github", "Database", "Globe2"].includes(option.id));

export const resourceTypeLabel: Record<TlozResourceType, string> = { link: "Enlace", document: "Documento", image: "Imagen", file: "Archivo", note: "Nota" };
const resourceTypeIcon: Record<TlozResourceType, string> = { link: "Link2", document: "FileText", image: "Image", file: "File", note: "StickyNote" };

export function resolveTlozIcon(icon?: string): LucideIcon {
  return (icon && iconRegistry[icon]) || CircleDot;
}

export function isGithubUrl(url?: string) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "github.com" || hostname === "www.github.com";
  } catch {
    return false;
  }
}

function isHttpUrl(value?: string) {
  if (!value) return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveResourceImageUrl(resource: Pick<TlozResource, "type" | "url" | "fileId">) {
  if (resource.type !== "image") return undefined;
  if (isHttpUrl(resource.url)) return resource.url?.trim();
  if (isHttpUrl(resource.fileId)) return resource.fileId?.trim();
  return undefined;
}

export function resourceUsesFileId(type: TlozResourceType) {
  return type === "file" || type === "document";
}

export function inferResourceIconId(resource: Pick<TlozResource, "type" | "url" | "icon">) {
  if (resource.icon?.trim()) return resource.icon;
  if (isGithubUrl(resource.url)) return "Github";
  return resourceTypeIcon[resource.type];
}

export function resolveResourceIcon(resource: Pick<TlozResource, "type" | "url" | "icon">) {
  return resolveTlozIcon(inferResourceIconId(resource));
}
