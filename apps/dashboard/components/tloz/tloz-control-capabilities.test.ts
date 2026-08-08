import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveTlozControlCapabilities } from "./tloz-control-capabilities";

const control = readFileSync(new URL("./tloz-control.tsx", import.meta.url), "utf8");

describe("TLOZ control capabilities", () => {
  it("keeps Mission controls contextual to lobby and project workspaces", () => {
    const lobby = resolveTlozControlCapabilities("mission");
    const workspace = resolveTlozControlCapabilities("mission", true);

    expect(lobby.projectFilter).toBe(true);
    expect(lobby.groupingOptions.map((option) => option.id)).toEqual([
      "status",
      "project",
      "none",
    ]);
    expect(workspace.projectFilter).toBe(false);
    expect(workspace.groupingOptions.map((option) => option.id)).toEqual([
      "status",
      "none",
    ]);
  });

  it("exposes only applicable sorting for Projects and Inventory", () => {
    const projects = resolveTlozControlCapabilities("project");
    const inventory = resolveTlozControlCapabilities("inventory");

    expect(projects.sortOptions.map((option) => option.id)).toEqual([
      "default",
      "title",
      "due-date",
    ]);
    expect(inventory.sortOptions.map((option) => option.id)).toEqual([
      "default",
      "title",
      "acquired-date",
    ]);
    expect(projects.ownerFilter).toBe(true);
    expect(inventory.completedFilter).toBe(true);
  });

  it("reuses the searchable user picker with a contextual all option", () => {
    expect(control).toContain("<UserPicker");
    expect(control).toContain('emptyLabel="Todos los responsables"');
    expect(control).toContain('ownerId: ownerId || "all"');
  });
});
