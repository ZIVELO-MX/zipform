import Link from "next/link";
import { collectionPageHref } from "./collection-pagination-url";

export function CollectionPagination({
  basePath,
  currentCursor,
  nextCursor,
}: {
  basePath: string;
  currentCursor?: string;
  nextCursor: string | null;
}) {
  if (!currentCursor && !nextCursor) return null;

  return (
    <nav aria-label="Paginación de colección" className="flex items-center justify-end gap-2 px-[26px] pb-[18px] text-[12px] font-semibold">
      {currentCursor ? (
        <Link className="rounded-md border px-3 py-1.5" href={basePath}>Primera página</Link>
      ) : null}
      {nextCursor ? (
        <Link className="rounded-md border px-3 py-1.5" href={collectionPageHref(basePath, nextCursor)}>Siguiente</Link>
      ) : null}
    </nav>
  );
}
