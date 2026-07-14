import { describe, expect, it } from "vitest";
import { sortProjectsByActivity } from "./project-navigation";

describe("sidebar project ordering", () => {
  it("orders projects by their latest project-or-mission activity", () => {
    const projects = [
      { id: "older", updatedAt: "2026-07-01T00:00:00.000Z" },
      { id: "mission-active", updatedAt: "2026-06-01T00:00:00.000Z" },
      { id: "newer", updatedAt: "2026-07-02T00:00:00.000Z" },
    ];
    const activity = new Map([["mission-active", "2026-07-03T00:00:00.000Z"]]);

    expect(sortProjectsByActivity(projects, activity).map((project) => project.id)).toEqual(["mission-active", "newer", "older"]);
    expect(projects.map((project) => project.id)).toEqual(["older", "mission-active", "newer"]);
  });
});
