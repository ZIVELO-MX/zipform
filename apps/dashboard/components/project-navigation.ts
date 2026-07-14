export function sortProjectsByActivity<T extends { id: string; updatedAt: string }>(projects: readonly T[], projectActivity: ReadonlyMap<string, string>) {
  return [...projects].sort((a, b) => (projectActivity.get(b.id) ?? b.updatedAt).localeCompare(projectActivity.get(a.id) ?? a.updatedAt));
}
