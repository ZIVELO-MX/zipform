import { describe, expect, it } from "vitest";
import { collectionQueryFilters, collectionQueryHref, resolveCollectionQuery } from "./collection-query";
import { collectionPageHref } from "./collection-pagination-url";

describe("collection queries", () => {
  it("normalizes unknown owners and invalid sort options", () => {
    expect(resolveCollectionQuery({ owner: "missing", sort: "invalid" }, [{ id: "owner" }])).toEqual({ ownerId: "all", sort: "default", showCompleted: true });
    expect(resolveCollectionQuery({ owner: "owner", sort: "title", completed: "0" }, [{ id: "owner" }])).toEqual({ ownerId: "owner", sort: "title", showCompleted: false });
  });

  it("uses configured status roles, including overrides, to hide completed records", () => {
    const filters = collectionQueryFilters({ ownerId: "owner", sort: "due-date", showCompleted: false }, [
      { value: "delivered", label: "Delivered", role: "done" },
      { value: "completed", label: "Reopened", role: "active" },
    ]);
    expect(filters).toMatchObject({ ownerId: "owner", sort: "due-date" });
    expect(filters.excludedStatuses).toContain("delivered");
    expect(filters.excludedStatuses).not.toContain("completed");
  });

  it("resets the cursor when changing filters and preserves filters on subsequent pages", () => {
    const href = collectionQueryHref("/workshop", "cursor=old&view=list", { ownerId: "a+b", sort: "title", showCompleted: false });
    expect(href).toBe("/workshop?view=list&owner=a%2Bb&completed=0&sort=title");
    expect(collectionPageHref(href, "next+id")).toBe(`${href}&cursor=next%2Bid`);
    expect(collectionQueryHref("/workshop", "owner=a&sort=title&completed=0&cursor=old", { ownerId: "all", sort: "default", showCompleted: true })).toBe("/workshop");
  });
});
