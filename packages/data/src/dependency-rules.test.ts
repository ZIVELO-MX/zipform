import { describe, expect, it } from "vitest";
import { assertAcyclicDependency } from "./dependency-rules";

describe("mission dependency rules", () => {
  it("rejects a transitive cycle", () => {
    expect(() => assertAcyclicDependency("a", "c", [
      { id: "c", dependsOnMissionId: "b" },
      { id: "b", dependsOnMissionId: "a" },
    ])).toThrow(/cycles/i);
  });

  it("accepts a graph with no path back to the mission", () => {
    expect(() => assertAcyclicDependency("a", "b", [
      { id: "c", dependsOnMissionId: "a" },
    ])).not.toThrow();
  });
});
