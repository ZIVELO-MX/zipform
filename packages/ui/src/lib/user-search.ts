import type { UserPickerOption } from "../components/user-picker";

export function normalizeUserSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

export function matchesUserSearch(user: UserPickerOption, query: string) {
  const candidate = `${user.name} ${user.username ?? ""}`;
  return normalizeUserSearch(candidate).includes(normalizeUserSearch(query));
}
