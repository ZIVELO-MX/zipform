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
});
