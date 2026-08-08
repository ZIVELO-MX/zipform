import type { TlozGrouping, TlozSort } from "./tloz-view-state";

export type TlozControlKind = "mission" | "project" | "inventory";

export type TlozControlOption<T extends string> = {
  id: T;
  name: string;
};

export type TlozControlCapabilities = {
  kind: TlozControlKind;
  projectFilter: boolean;
  ownerFilter: boolean;
  completedFilter: boolean;
  sortOptions: TlozControlOption<TlozSort>[];
  groupingOptions: TlozControlOption<TlozGrouping>[];
};

const DEFAULT_SORT = { id: "default", name: "Predeterminado" } as const;
const TITLE_SORT = { id: "title", name: "Título" } as const;
const STATUS_GROUP = { id: "status", name: "Estado" } as const;
const NO_GROUP = { id: "none", name: "Sin agrupar" } as const;

export function resolveTlozControlCapabilities(
  kind: TlozControlKind,
  fixedProject = false,
): TlozControlCapabilities {
  if (kind === "inventory") {
    return {
      kind,
      projectFilter: false,
      ownerFilter: true,
      completedFilter: true,
      sortOptions: [
        DEFAULT_SORT,
        TITLE_SORT,
        { id: "acquired-date", name: "Fecha de adquisición" },
      ],
      groupingOptions: [STATUS_GROUP, NO_GROUP],
    };
  }

  if (kind === "project") {
    return {
      kind,
      projectFilter: false,
      ownerFilter: true,
      completedFilter: true,
      sortOptions: [
        DEFAULT_SORT,
        TITLE_SORT,
        { id: "due-date", name: "Fecha límite" },
      ],
      groupingOptions: [STATUS_GROUP, NO_GROUP],
    };
  }

  return {
    kind,
    projectFilter: !fixedProject,
    ownerFilter: true,
    completedFilter: true,
    sortOptions: [
      DEFAULT_SORT,
      { id: "dependencies", name: "Dependencias" },
      { id: "due-date", name: "Fecha límite" },
      TITLE_SORT,
    ],
    groupingOptions: [
      STATUS_GROUP,
      ...(fixedProject ? [] : [{ id: "project", name: "Proyecto" } as const]),
      NO_GROUP,
    ],
  };
}
