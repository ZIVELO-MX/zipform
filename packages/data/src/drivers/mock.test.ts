import { describe, expect, it } from "vitest";
import { currentUser, missions } from "../seed-data";
import { createMockDataClient } from "./mock";

describe("mock data driver", () => {
  it("serves the read repositories", async () => {
    const client = createMockDataClient();
    expect(await client.apps.list()).not.toHaveLength(0);
    expect(await client.user.getCurrent()).toEqual(currentUser);
    expect(await client.tloz.getUsers()).toEqual(expect.arrayContaining([currentUser]));
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
      title: "Created mission",
      projectId: template.projectId!,
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

  it("persists mission creation defaults", async () => {
    const client = createMockDataClient();
    const template = missions[0];
    const created = await client.tloz.createMission({
      title: "Minimal API mission",
      type: "side_quest",
      ownerId: template.ownerId,
      projectId: template.projectId!,
    });

    expect(created).toMatchObject({
      description: "",
      icon: "Sword",
      status: "next",
      progress: 0,
    });
  });

  it("materializes Markdown checkboxes during mission creation", async () => {
    const client = createMockDataClient();
    const template = missions[0];
    const created = await client.tloz.createMission({
      title: "Mission with outcomes",
      description: "Short outcome",
      descriptionDetail: "## Outcomes\n- [x] First outcome\n- [ ] Second outcome",
      type: "side_quest",
      ownerId: template.ownerId,
      projectId: template.projectId!,
    });

    expect(created.progress).toBe(50);
    expect((await client.tloz.getMissionDetail(created.id))?.checklist).toEqual([
      expect.objectContaining({ title: "First outcome", completed: true, position: 0 }),
      expect.objectContaining({ title: "Second outcome", completed: false, position: 1 }),
    ]);
  });

  it("uses Markdown as checklist source of truth and persists mission relations", async () => {
    const client = createMockDataClient();
    const mission = missions[0];
    const dependency = missions.find((item) => item.id !== mission.id && item.projectId === mission.projectId)!;
    const questItem = (await client.tloz.getQuestItems())[0];

    let detail = await client.tloz.saveMissionDocument(mission.id, "# Work\n- [ ] First\n- [x] Second");
    expect(detail.descriptionDetail).toContain("- [x] Second");
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

    detail = await client.tloz.addMissionResource(mission.id, { type: "link", title: "Spec", url: "https://example.com", icon: "Globe2" });
    const resource = detail.resources.find((item) => item.title === "Spec")!;
    expect(resource.url).toBe("https://example.com");
    expect(resource.icon).toBe("Globe2");
    expect((await client.tloz.removeMissionResource(mission.id, resource.id)).resources).not.toContainEqual(expect.objectContaining({ id: resource.id }));
  });

  it("rejects dependencies outside the mission project", async () => {
    const client = createMockDataClient();
    const mission = missions[0];
    const otherProjectMission = missions.find((item) => item.projectId !== mission.projectId)!;
    await expect(client.tloz.addMissionDependency(mission.id, otherProjectMission.id))
      .rejects.toThrow("same project");
  });

  it("creates dependent picker entities and allows clearing the hierarchy", async () => {
    const client = createMockDataClient();
    const project = await client.tloz.createProject({ name: "New project", description: "", icon: "FolderKanban", color: "#2D6CDF", status: "active", type: "normal", ownerId: currentUser.id, startDate: "2026-07-01" });
    const season = await client.tloz.createSeason("Season III");
    const episode = await client.tloz.createEpisode("First episode", season.id);
    expect(project).toMatchObject({ name: "New project", status: "active" });
    expect(episode).toMatchObject({ seasonId: season.id, name: "First episode" });

    const mission = missions[0];
    expect(await client.tloz.updateMission(mission.id, { projectId: project.id, seasonId: season.id, episodeId: episode.id })).toMatchObject({ projectId: project.id, seasonId: season.id, episodeId: episode.id });
    expect(await client.tloz.updateMission(mission.id, { projectId: "", seasonId: "", episodeId: "" })).toMatchObject({ projectId: undefined, seasonId: undefined, episodeId: undefined });
  });

  it("supports agent authentication and mission assignment", async () => {
    const client = createMockDataClient();
    const agent = await client.agent.create({ name: "TestAgent", username: "testagent", email: "agent@test.com", role: "agent:operative" }, "owner");
    const keyResult = await client.agent.createApiKey(agent.user.id, "test-key", "owner");
    const authenticated = await client.agent.authenticateWithApiKey(keyResult.key);
    expect(authenticated?.id).toBe(agent.user.id);
    expect(authenticated?.type).toBe("agent");

    const mission = missions[0];
    const assigned = await client.tloz.updateMission(mission.id, { ownerId: agent.user.id });
    expect(assigned.ownerId).toBe(agent.user.id);
    expect((await client.tloz.getMissionDetail(mission.id))?.owner.id).toBe(agent.user.id);
  });

  it("allows agents to patch mission status and manage sub-resources", async () => {
    const client = createMockDataClient();
    const mission = missions[0];
    const agentUser = (await client.agent.list()).find((u) => u.type === "agent")
      ?? (await client.agent.create({ name: "Bot", username: "bot", email: "bot@test.com", role: "agent:operative" }, "owner")).user;

    const completed = await client.tloz.patchMissionStatus(mission.id, "completed");
    expect(completed.status).toBe("completed");

    const uncompleted = await client.tloz.updateMission(mission.id, { status: "now", completedAt: undefined });
    expect(uncompleted.status).toBe("now");

    const dep = missions.find((item) => item.id !== mission.id && item.projectId === mission.projectId)!;
    await client.tloz.addMissionDependency(mission.id, dep.id);
    expect((await client.tloz.getMissionDetail(mission.id))?.dependencies).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: dep.id })])
    );
    await client.tloz.removeMissionDependency(mission.id, dep.id);
    expect((await client.tloz.getMissionDetail(mission.id))?.dependencies).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: dep.id })])
    );

    const resource = (await client.tloz.addMissionResource(mission.id, { type: "link", title: "Spec", url: "https://spec.com" })).resources.at(-1)!;
    expect(resource.title).toBe("Spec");
    await client.tloz.removeMissionResource(mission.id, resource.id);

    const qi = (await client.tloz.getQuestItems())[0];
    await client.tloz.setMissionQuestItem(mission.id, qi.id, true);
    expect((await client.tloz.getMissionDetail(mission.id))?.missionQuestItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ questItemId: qi.id, required: true })])
    );
    await client.tloz.removeMissionQuestItem(mission.id, qi.id);

    const saved = await client.tloz.saveMissionDocument(mission.id, "# Doc\n- [ ] Task");
    expect(saved.descriptionDetail).toContain("- [ ] Task");
    expect(saved.checklist).toHaveLength(1);
  });

  it("supports create, update, and delete for projects and quest-items", async () => {
    const client = createMockDataClient();
    const project = await client.tloz.createProject({
      name: "New Project", description: "desc", icon: "Box", color: "#3366FF",
      status: "active", type: "system", ownerId: currentUser.id, startDate: "2026-07-01"
    });
    expect(project.name).toBe("New Project");

    const updatedProject = await client.tloz.updateProject(project.id, { name: "Updated Project" });
    expect(updatedProject.name).toBe("Updated Project");

    const qi = await client.tloz.createQuestItem({
      name: "New Item", description: "", icon: "Key", status: "locked", category: "tool"
    });
    expect(qi.name).toBe("New Item");

    const updatedQi = await client.tloz.updateQuestItem(qi.id, { name: "Updated Item" });
    expect(updatedQi.name).toBe("Updated Item");
  });

  it("handles mission document save with checklist parsing and progress", async () => {
    const client = createMockDataClient();
    const mission = missions[0];
    const detail = await client.tloz.saveMissionDocument(mission.id, "- [x] Done\n- [ ] Todo");
    expect(detail.progress).toBe(50);
    expect(detail.checklist).toHaveLength(2);
    expect(detail.checklist[0].completed).toBe(true);
  });

  it("updates system-project entities and keeps resources scoped to one owner", async () => {
    const client = createMockDataClient();
    const project = (await client.tloz.getProjects())[0];
    const item = (await client.tloz.getQuestItems())[0];

    expect(await client.tloz.updateProject(project.id, { name: "Updated project", status: "archived", dueDate: "2026-08-01" }))
      .toMatchObject({ name: "Updated project", status: "archived", dueDate: "2026-08-01" });
    expect(await client.tloz.updateQuestItem(item.id, { status: "unlocked", category: "asset", acquiredAt: "2026-07-01" }))
      .toMatchObject({ status: "unlocked", category: "asset", acquiredAt: "2026-07-01" });

    const projectResources = await client.tloz.addProjectResource(project.id, { type: "link", title: "Project brief" });
    expect(projectResources.at(-1)).toMatchObject({ projectId: project.id });
    expect(projectResources.at(-1)).not.toHaveProperty("missionId");
    expect(projectResources.at(-1)).not.toHaveProperty("questItemId");
    const itemResources = await client.tloz.addQuestItemResource(item.id, { type: "document", title: "Inventory spec" });
    expect(itemResources.at(-1)).toMatchObject({ questItemId: item.id });
    expect(itemResources.at(-1)).not.toHaveProperty("missionId");
    expect(itemResources.at(-1)).not.toHaveProperty("projectId");

    await client.tloz.removeProjectResource(project.id, projectResources.at(-1)!.id);
    await client.tloz.removeQuestItemResource(item.id, itemResources.at(-1)!.id);
    expect((await client.tloz.getResources()).filter((resource) => resource.projectId === project.id || resource.questItemId === item.id)).toEqual([]);
  });

  it("lists the default avatars", async () => {
    const client = createMockDataClient();
    const result = await client.platform.listAvatars();
    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Semielfo", imageUrl: expect.stringContaining("Semielfo") }),
        expect.objectContaining({ name: "Dragon", imageUrl: expect.stringContaining("Dragon") }),
        expect.objectContaining({ name: "ZIBOT", imageUrl: expect.stringContaining("Zibot") }),
      ])
    );
  });
});
