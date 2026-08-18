import { describe, expect, it } from "vitest";
import { collectionPageHref } from "./collection-pagination-url";

describe("collectionPageHref", () => {
  it("encodes opaque cursors in the collection URL", () => {
    expect(collectionPageHref("/projects", "row/25+next")).toBe("/projects?cursor=row%2F25%2Bnext");
  });
});
