export function collectionPageHref(basePath: string, cursor: string): string {
  return `${basePath}?cursor=${encodeURIComponent(cursor)}`;
}
