import { describe, expect, it, vi } from "vitest";
import { collectPaginated } from "./pagination";

describe("collectPaginated", () => {
  it("collects bounded pages in order until nextCursor is null", async () => {
    const readPage = vi.fn(async (cursor?: string) => cursor
      ? { data: [3, 4], nextCursor: null }
      : { data: [1, 2], nextCursor: "page-2" });

    await expect(collectPaginated(readPage)).resolves.toEqual([1, 2, 3, 4]);
    expect(readPage).toHaveBeenNthCalledWith(1, undefined);
    expect(readPage).toHaveBeenNthCalledWith(2, "page-2");
  });

  it("rejects a repeated cursor instead of returning partial data", async () => {
    const readPage = vi.fn(async () => ({ data: [1], nextCursor: "repeat" }));

    await expect(collectPaginated(readPage)).rejects.toMatchObject({
      name: "PaginationCursorError",
      cursor: "repeat",
    });
  });
});
