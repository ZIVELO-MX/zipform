export function collectionPageHref(basePath: string, cursor: string): string {
  const [path, search] = basePath.split("?");
  const params = new URLSearchParams(search);
  params.set("cursor", cursor);
  return `${path}?${params.toString()}`;
}
