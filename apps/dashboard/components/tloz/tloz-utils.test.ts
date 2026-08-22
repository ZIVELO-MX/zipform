import { describe, expect, it } from "vitest";
import { resolveStatusPresentation } from "./tloz-utils";

describe("status presentation", () => {
  it.each([
    ["active", "Active", "#4B8D5E", "active"],
    ["maintenance", "Maintenance", "#3B82F6", "ready"],
    ["paused", "Paused / Blocked", "#6B7280", "blocked"],
    ["completed", "Completed", "#166534", "done"],
  ] as const)("resolves the Project %s status", (value, label, color, role) => {
    expect(resolveStatusPresentation(value, [], "project")).toEqual({
      label,
      dotColor: color,
      textColor: color,
      role,
    });
  });

  it("prefers configured presentation metadata", () => {
    expect(resolveStatusPresentation("active", [
      { value: "active", label: "En curso", color: "#123456", role: "ready" },
    ], "project")).toEqual({
      label: "En curso",
      dotColor: "#123456",
      textColor: "#123456",
      role: "ready",
    });
  });

  it("preserves Mission completed semantics", () => {
    expect(resolveStatusPresentation("completed", [], "mission")).toMatchObject({
      textColor: "#B91C22",
      role: "done",
    });
  });
});
