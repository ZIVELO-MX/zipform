import type { TlozFieldOption } from "@tloz/types";
import { tlozStatusRole } from "./tloz-view-query";

export type CollectionQuery = {
  ownerId: string;
  showCompleted: boolean;
  sort: "default" | "title" | "due-date" | "acquired-date";
};
export type CollectionSearchParams = { cursor?: string; owner?: string; completed?: string; sort?: string };

export function resolveCollectionQuery(params: CollectionSearchParams, users: Array<{ id: string }>): CollectionQuery {
  return {
    ownerId: users.some((user) => user.id === params.owner) ? params.owner! : "all",
    showCompleted: params.completed !== "0",
    sort: params.sort === "title" || params.sort === "due-date" || params.sort === "acquired-date" ? params.sort : "default",
  };
}

export function collectionQueryFilters(query: CollectionQuery, statusOptions: TlozFieldOption[]) {
  const statuses = new Set(["completed", "archived", "unlocked", "done", ...statusOptions.map((option) => option.value)]);
  return {
    ...(query.ownerId === "all" ? {} : { ownerId: query.ownerId }),
    ...(query.showCompleted ? {} : { excludedStatuses: [...statuses].filter((status) => tlozStatusRole(status, statusOptions) === "done") }),
    ...(query.sort === "default" ? {} : { sort: query.sort }),
  };
}

export function collectionQueryHref(path: string, search: string, query: CollectionQuery) {
  const params = new URLSearchParams(search);
  params.delete("cursor");
  if (query.ownerId === "all") params.delete("owner"); else params.set("owner", query.ownerId);
  if (query.showCompleted) params.delete("completed"); else params.set("completed", "0");
  if (query.sort === "default") params.delete("sort"); else params.set("sort", query.sort);
  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}
