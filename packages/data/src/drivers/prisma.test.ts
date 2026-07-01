import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  checklistItems, currentUser, episodes, missionDependencies, missionQuestItems, missions,
  projects, questItems, resources, seasons, userMissionStates, users
} from "../seed-data";
import { createPrismaDataClient } from "./prisma";

const date = (value: string) => new Date(value);
const nullable = <T>(value: T | undefined) => value ?? null;

function createPrismaStub() {
  const missionRows = missions.map((item) => ({
    ...item,
    seasonId: nullable(item.seasonId), episodeId: nullable(item.episodeId), dueDate: nullable(item.dueDate),
    startDate: nullable(item.startDate), conclusion: nullable(item.conclusion), blockedReason: nullable(item.blockedReason),
    completedAt: item.completedAt ? date(item.completedAt) : null, createdAt: date(item.createdAt), updatedAt: date(item.updatedAt)
  }));
  const withDates = <T extends { createdAt: string; updatedAt?: string }>(item: T) => ({
    ...item, createdAt: date(item.createdAt), ...(item.updatedAt ? { updatedAt: date(item.updatedAt) } : {})
  });
  const findMany = <T>(rows: T[]) => vi.fn(async () => rows);

  const prisma = {
    session: { findFirst: vi.fn(async () => ({ user: currentUser })) },
    user: { findFirst: vi.fn(async () => currentUser), findMany: findMany(users) },
    platformMetric: { findMany: vi.fn(async () => [{ label: "Health", value: "100", tone: "good" }]) },
    tlozSeason: { findMany: findMany(seasons.map((item) => ({ ...withDates(item), endDate: nullable(item.endDate) }))) },
    tlozEpisode: { findMany: findMany(episodes.map((item) => ({ ...withDates(item), endDate: nullable(item.endDate) }))) },
    tlozProject: { findMany: findMany(projects.map(withDates)) },
    tlozMission: {
      findMany: findMany(missionRows),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        missionRows.push({ ...data, createdAt: new Date(), updatedAt: new Date() } as never);
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const index = missionRows.findIndex((item) => item.id === where.id);
        if (index < 0) throw new Error("not found");
        missionRows[index] = { ...missionRows[index], ...data, updatedAt: new Date() } as never;
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = missionRows.findIndex((item) => item.id === where.id);
        if (index < 0) throw new Error("not found");
        missionRows.splice(index, 1);
      })
    },
    tlozMissionDependency: { findMany: findMany(missionDependencies.map(withDates)) },
    tlozQuestItem: { findMany: findMany(questItems.map((item) => ({ ...withDates(item), acquiredAt: nullable(item.acquiredAt) }))) },
    tlozMissionQuestItem: { findMany: findMany(missionQuestItems.map(withDates)) },
    tlozChecklistItem: { findMany: findMany(checklistItems.map(withDates)) },
    tlozResource: { findMany: findMany(resources.map((item) => ({ ...withDates(item), url: nullable(item.url), fileId: nullable(item.fileId) }))) },
    tlozUserMissionState: { findMany: findMany(userMissionStates.map(withDates)) }
  };

  return prisma as unknown as PrismaClient;
}

describe("prisma data driver", () => {
  it("maps persistent records for every read operation", async () => {
    const client = createPrismaDataClient(createPrismaStub());
    expect(await client.user.getCurrent()).toEqual(currentUser);
    expect(await client.platform.getMetrics()).toEqual([{ label: "Health", value: "100", tone: "good" }]);
    expect(await client.tloz.getMissions()).toHaveLength(missions.length);
    expect(await client.tloz.getMissionDetail(missions[0].id)).not.toBeNull();
    expect((await client.tloz.getDashboardSummary()).projects).toHaveLength(projects.length);
    expect(await client.tloz.getProjects()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: projects[0].id, color: projects[0].color })
    ]));
    expect(await client.tloz.getSeasons()).toHaveLength(seasons.length);
    expect(await client.tloz.getEpisodes()).toHaveLength(episodes.length);
    expect(await client.tloz.getQuestItems()).toHaveLength(questItems.length);
    const source = missions[0];
    expect(await client.tloz.getMissions({
      projectId: source.projectId,
      seasonId: source.seasonId,
      episodeId: source.episodeId,
      ownerId: source.ownerId
    })).toEqual(expect.arrayContaining([expect.objectContaining({ id: source.id })]));
    expect(await client.tloz.getMissions({ ownerId: "missing" })).toEqual([]);
  });

  it("creates, updates, completes and deletes missions", async () => {
    const client = createPrismaDataClient(createPrismaStub());
    const { createdAt: _createdAt, updatedAt: _updatedAt, completedAt: _completedAt, ...input } = missions[0];
    const created = await client.tloz.createMission({ ...input, id: "prisma-test", title: "Created" });
    expect(created.title).toBe("Created");
    const updated = await client.tloz.updateMission(created.id, { title: "Updated", startDate: "2026-07-01" });
    expect(updated).toMatchObject({ title: "Updated", startDate: "2026-07-01" });
    expect((await client.tloz.patchMissionStatus(created.id, "completed")).completedAt).toBeTruthy();
    await client.tloz.deleteMission(created.id);
    expect(await client.tloz.getMissionDetail(created.id)).toBeNull();
  });
});
