import { describe, expect, it } from "vitest";
import { ReleaseBaselineError, release1Projects, resolveReleaseProjectOwners } from "./release-1-baseline";

describe("release 1 baseline", () => {
  it("defines the four clean release projects", () => {
    expect(release1Projects).toEqual([
      expect.objectContaining({ name: "Koda", icon: "Utensils", color: "#f97316" }),
      expect.objectContaining({ name: "Fidelity", icon: "Star", color: "#f97316" }),
      expect.objectContaining({ name: "TLOZ", icon: "Sword", color: "#d72228" }),
      expect.objectContaining({ name: "Web Corporativa", icon: "Globe2", color: "#2563eb" }),
    ]);
  });

  it("keeps the existing primary users as project owners", () => {
    expect(resolveReleaseProjectOwners(["benji", "raul"])).toEqual({ primaryOwnerId: "benji", fidelityOwnerId: "raul" });
  });

  it("fails before cleanup when no users can be preserved", () => {
    expect(() => resolveReleaseProjectOwners([])).toThrowError(
      new ReleaseBaselineError("Cannot prepare the release baseline because no users exist."),
    );
  });
});
