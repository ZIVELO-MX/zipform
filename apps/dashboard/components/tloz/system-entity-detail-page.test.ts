import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const wrapper = readFileSync(new URL("./system-entity-detail-page.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/tloz/[projectSlug]/[missionId]/page.tsx", import.meta.url), "utf8");

describe("system entity detail mission navigation", () => {
  it("opens related project missions in the right-side view", () => {
    expect(wrapper).toContain("onNavigateMission: setSelectedMission");
    expect(wrapper).toContain("<MissionSlideOver mission={selectedMission}");
    expect(page).toContain('<SystemEntityDetailPage variant="project"');
    expect(page).not.toContain('<SystemEntityDetail variant="project"');
  });
});
