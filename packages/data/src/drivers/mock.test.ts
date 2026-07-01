import { describe, expect, it } from "vitest";
import { currentUser, missions } from "../seed-data";
import { createMockDataClient } from "./mock";

describe("mock data driver", () => {
  it("serves the read repositories", async () => {
    const client = createMockDataClient();
    expect(await client.apps.list()).not.toHaveLength(0);
    expect(await client.user.getCurrent()).toEqual(currentUser);
    expect((await client.tloz.getDashboardSummary()).projects).not.toHaveLength(0);
    expect(await client.tloz.getMissionDetail("missing")).toBeNull();
    const source = missions[0];
    expect(await client.tloz.getMissions({
      projectId: source.projectId,
      seasonId: source.seasonId,
      episodeId: source.episodeId,
      ownerId: source.ownerId
    })).toEqual(expect.arrayContaining([expect.objectContaining({ id: source.id })]));
    expect(await client.tloz.getMissions({ projectId: "missing" })).toEqual([]);
  });

  it("creates, updates, patches and deletes a mission without leaking state", async () => {
    const client = createMockDataClient();
    const template = missions[0];
    const { createdAt: _createdAt, updatedAt: _updatedAt, completedAt: _completedAt, ...input } = template;
    const created = await client.tloz.createMission({
      ...input,
      id: "test-mission",
      title: "Created mission"
    });
    expect(created.title).toBe("Created mission");

    const updated = await client.tloz.updateMission(created.id, { title: "Updated mission", progress: 50 });
    expect(updated).toMatchObject({ title: "Updated mission", progress: 50 });
    const completed = await client.tloz.patchMissionStatus(created.id, "completed");
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeTruthy();

    await client.tloz.deleteMission(created.id);
    expect(await client.tloz.getMissionDetail(created.id)).toBeNull();
    await expect(client.tloz.updateMission(created.id, { title: "nope" })).rejects.toThrow("was not found");
    await expect(client.tloz.deleteMission(created.id)).rejects.toThrow("was not found");
    expect(await createMockDataClient().tloz.getMissions()).toHaveLength(missions.length);
  });

  it("uses Markdown as checklist source of truth and persists mission relations", async () => {
    const client = createMockDataClient();
    const mission = missions[0];
    const dependency = missions.find((item) => item.id !== mission.id)!;
    const questItem = (await client.tloz.getQuestItems())[0];

    let detail = await client.tloz.saveMissionDocument(mission.id, "# Work\n- [ ] First\n- [x] Second");
    expect(detail.description).toContain("- [x] Second");
    expect(detail.progress).toBe(50);
    expect(detail.checklist.map((item) => [item.title, item.completed, item.position])).toEqual([
      ["First", false, 0], ["Second", true, 1]
    ]);

    detail = await client.tloz.saveMissionDocument(mission.id, "- [x] First");
    expect(detail.checklist).toHaveLength(1);
    expect(detail.checklist[0]).toMatchObject({ title: "First", completed: true, position: 0 });
    expect(detail.progress).toBe(100);

    detail = await client.tloz.addMissionDependency(mission.id, dependency.id);
    expect(detail.dependencies).toEqual(expect.arrayContaining([expect.objectContaining({ id: dependency.id })]));
    expect((await client.tloz.getMissionDetail(dependency.id))?.requiredBy).toEqual(expect.arrayContaining([expect.objectContaining({ id: mission.id })]));
    await client.tloz.removeMissionDependency(mission.id, dependency.id);

    detail = await client.tloz.setMissionQuestItem(mission.id, questItem.id, true);
    expect(detail.missionQuestItems).toEqual(expect.arrayContaining([expect.objectContaining({ questItemId: questItem.id, required: true })]));
    await client.tloz.removeMissionQuestItem(mission.id, questItem.id);

    detail = await client.tloz.addMissionResource(mission.id, { type: "link", title: "Spec", url: "https://example.com" });
    const resource = detail.resources.find((item) => item.title === "Spec")!;
    expect(resource.url).toBe("https://example.com");
    expect((await client.tloz.removeMissionResource(mission.id, resource.id)).resources).not.toContainEqual(expect.objectContaining({ id: resource.id }));
  });

  it("creates dependent picker entities and allows clearing the hierarchy", async () => {
    const client = createMockDataClient();
    const project = await client.tloz.createProject("New project");
    const season = await client.tloz.createSeason("Season III");
    const episode = await client.tloz.createEpisode("First episode", season.id);
    expect(project).toMatchObject({ name: "New project", status: "active" });
    expect(episode).toMatchObject({ seasonId: season.id, name: "First episode" });

    const mission = missions[0];
    expect(await client.tloz.updateMission(mission.id, { projectId: project.id, seasonId: season.id, episodeId: episode.id })).toMatchObject({ projectId: project.id, seasonId: season.id, episodeId: episode.id });
    expect(await client.tloz.updateMission(mission.id, { projectId: "", seasonId: "", episodeId: "" })).toMatchObject({ projectId: undefined, seasonId: undefined, episodeId: undefined });
  });
});
