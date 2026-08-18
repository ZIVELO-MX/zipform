export class PaginationCursorError extends Error {
  constructor(
    public readonly cursor: string,
    options?: ErrorOptions,
  ) {
    super("El cursor no pertenece a la colección solicitada.", options);
    this.name = "PaginationCursorError";
  }
}

/**
 * Resolves the first record after a cursor for in-memory drivers.
 *
 * A missing cursor is a client error, not an instruction to restart at page
 * one. Keeping that invariant in the data layer makes mock and Prisma-backed
 * pagination behave the same way.
 */
export function paginationStartIndex<T extends { id: string }>(
  records: T[],
  cursor?: string,
): number {
  if (!cursor) return 0;
  const index = records.findIndex((record) => record.id === cursor);
  if (index < 0) throw new PaginationCursorError(cursor);
  return index + 1;
}

type Page<T> = { data: T[]; nextCursor: string | null };

/**
 * Reads a complete scoped collection through bounded server-side pages.
 *
 * This is reserved for consumers that genuinely need every item, such as the
 * resource list for one document. A repeated cursor fails loudly instead of
 * looping or returning a plausible partial collection.
 */
export async function collectPaginated<T>(
  readPage: (cursor?: string) => Promise<Page<T>>,
): Promise<T[]> {
  const data: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  do {
    const page = await readPage(cursor);
    data.push(...page.data);
    if (!page.nextCursor) return data;
    if (seenCursors.has(page.nextCursor)) {
      throw new PaginationCursorError(page.nextCursor);
    }
    seenCursors.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);

  return data;
}
