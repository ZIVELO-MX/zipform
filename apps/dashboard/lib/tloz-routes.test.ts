import { describe, expect, it } from "vitest";
import { getSystemProject, inventoryItemHref, missionHref, projectDetailHref, projectHref, resolveResponsiveTlozViews, resolveTlozView } from "./tloz-routes";

describe("TLOZ routes", () => {
  const project = { name: "Core Platform", slug: "core" };

  it("keeps project and mission public identifiers in canonical URLs", () => {
    expect(projectHref(project)).toBe("/tloz/core");
    expect(missionHref(project, "COR-0007")).toBe("/tloz/core/COR-0007");
  });

  it("encodes entity identifiers in system detail URLs", () => {
    expect(inventoryItemHref("access/key")).toBe("/tloz/inventory/access%2Fkey");
    expect(projectDetailHref("project core")).toBe("/tloz/projects/project%20core");
  });

  it("falls back to the context default when a view is unsupported", () => {
    expect(resolveTlozView("board", ["table", "list"], "table")).toBe("table");
    expect(getSystemProject("inventory")?.detailVariant).toBe("inventory");
  });

  it("exposes only list and table on mobile", () => {
    expect(resolveResponsiveTlozViews(true, ["dashboard", "list", "board", "table", "calendar"], "dashboard")).toEqual({
      views: ["list", "table"],
      defaultView: "list",
    });
    expect(resolveResponsiveTlozViews(true, ["table", "list"], "table")).toEqual({
      views: ["list", "table"],
      defaultView: "table",
    });
  });

  it("preserves configured views and defaults on desktop", () => {
    const views = ["dashboard", "list", "board", "table", "calendar"] as const;
    expect(resolveResponsiveTlozViews(false, views, "dashboard")).toEqual({ views, defaultView: "dashboard" });
  });
});
