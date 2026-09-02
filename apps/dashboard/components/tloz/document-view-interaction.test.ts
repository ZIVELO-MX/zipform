import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./document-view-renderer.tsx", import.meta.url), "utf8");

describe("DocumentViewRenderer Mission selection", () => {
  it("opens and closes the legacy Mission panel without a canonical document", () => {
    expect(source).toContain('selection.kind === "legacy-mission"');
    expect(source).toContain("setSelectedMission(selection.mission)");
    expect(source).toContain("mission={selectedMission}");
    expect(source).toContain("onClose={() => setSelectedMission(null)}");
  });

  it("keeps legacy Mission navigation on the stable mobile route", () => {
    expect(source).toContain("missionHref(selection.mission.project, selection.mission.displayId)");
  });
});
