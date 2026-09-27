import { describe, expect, it } from "vitest";
import { dashboardFocusMissionIds } from "./dashboard-focus";

const mission = (id: string, type: "main_quest" | "side_quest" | "farming_quest" | "exploration_quest") => ({ id, type } as never);

describe("dashboard focus selection", () => {
  it("selects only the first quest and first support mission", () => {
    const ids = dashboardFocusMissionIds([
      mission("side-1", "side_quest"),
      mission("main-1", "main_quest"),
      mission("support-1", "farming_quest"),
      mission("support-2", "exploration_quest"),
    ]);

    expect([...ids]).toEqual(["side-1", "support-1"]);
  });

  it("returns no IDs when no focus candidates exist", () => {
    expect(dashboardFocusMissionIds([])).toEqual(new Set());
  });
});
