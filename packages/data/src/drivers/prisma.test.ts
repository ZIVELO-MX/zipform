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
    startDate: nullable(item.startDate), descriptionDetail: item.descriptionDetail, blockedReason: nullable(item.blockedReason),
    completedAt: item.completedAt ? date(item.completedAt) : null, createdAt: date(item.createdAt), updatedAt: date(item.updatedAt)
  }));
  const withDates = <T extends { createdAt: string; updatedAt?: string }>(item: T) => ({
    ...item, createdAt: date(item.createdAt), ...(item.updatedAt ? { updatedAt: date(item.updatedAt) } : {})
  });
  const checklistRows = checklistItems.map(withDates);
  const resourceRows = resources.map((item) => ({ ...withDates(item), icon: nullable(item.icon), url: nullable(item.url), fileId: nullable(item.fileId) }));
  const findMany = <T>(rows: T[]) => vi.fn(async () => rows);

  const deleteMany = vi.fn(async () => ({}));

  const avatarRows = [
    { id: "s1", name: "Semielfo", imageUrl: "https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Semielfo.jpeg" },
    { id: "s2", name: "Dragon", imageUrl: "https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Dragon.jpeg" },
    { id: "s3", name: "ZIBOT", imageUrl: "https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Zibot.jpeg" },
  ];

  const prisma = {
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === "function") {
        return arg(prisma);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
    }),
    session: { findFirst: vi.fn(async () => ({ user: currentUser })) },
    user: { findFirst: vi.fn(async () => currentUser), findMany: findMany(users) },
    avatar: { findMany: findMany(avatarRows) },
    platformMetric: { findMany: vi.fn(async () => [{ label: "Health", value: "100", tone: "good" }]) },
    tlozSeason: { findMany: findMany(seasons.map((item) => ({ ...withDates(item), endDate: nullable(item.endDate) }))) },
    tlozEpisode: { findMany: findMany(episodes.map((item) => ({ ...withDates(item), endDate: nullable(item.endDate) }))) },
    tlozProject: {
      findMany: findMany(projects.map(withDates)),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => projects.find((project) => project.id === where.id) ?? null),
    },
    tlozMission: {
      findMany: findMany(missionRows),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const newRow = { ...data, createdAt: new Date(), updatedAt: new Date() } as never;
        missionRows.push(newRow);
        return newRow;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const index = missionRows.findIndex((item) => item.id === where.id);
        if (index < 0) throw new Error("not found");
        missionRows[index] = { ...missionRows[index], ...data, updatedAt: new Date() } as never;
        return missionRows[index];
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = missionRows.findIndex((item) => item.id === where.id);
        if (index < 0) throw new Error("not found");
        missionRows.splice(index, 1);
      })
    },
    tlozMissionDependency: {
      findMany: findMany(missionDependencies.map(withDates)),
      deleteMany,
    },
    tlozQuestItem: { findMany: findMany(questItems.map((item) => ({ ...withDates(item), acquiredAt: nullable(item.acquiredAt) }))) },
    tlozMissionQuestItem: {
      findMany: findMany(missionQuestItems.map(withDates)),
      deleteMany,
    },
    tlozChecklistItem: {
      findMany: findMany(checklistRows),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = data as never;
        checklistRows.push(row);
        return row;
      }),
      deleteMany,
    },
    tlozResource: {
      findMany: findMany(resourceRows),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { ...data, icon: nullable(data.icon as string | undefined), url: nullable(data.url as string | undefined), fileId: nullable(data.fileId as string | undefined), createdAt: new Date(), updatedAt: new Date() } as never;
        resourceRows.push(row);
        return row;
      }),
      deleteMany,
    },
    tlozUserMissionState: {
      findMany: findMany(userMissionStates.map(withDates)),
      deleteMany,
    }
  };

  return prisma as unknown as PrismaClient;
}

describe("prisma data driver", () => {
  it("maps persistent records for every read operation", async () => {
    const client = createPrismaDataClient(createPrismaStub());
    expect(await client.user.getCurrent()).toEqual(currentUser);
    expect(await client.tloz.getUsers()).toEqual(expect.arrayContaining([expect.objectContaining({ id: currentUser.id })]));
    expect(await client.platform.getMetrics()).toEqual([{ label: "Health", value: "100", tone: "good" }]);
    expect(await client.platform.listAvatars()).toEqual([
      expect.objectContaining({ name: "Semielfo", imageUrl: expect.stringContaining("Semielfo") }),
      expect.objectContaining({ name: "Dragon", imageUrl: expect.stringContaining("Dragon") }),
      expect.objectContaining({ name: "ZIBOT", imageUrl: expect.stringContaining("Zibot") }),
    ]);
    expect(await client.tloz.getMissions()).toHaveLength(missions.length);
    expect(await client.tloz.getMissionDetail(missions[0].id)).not.toBeNull();
    expect((await client.tloz.getDashboardSummary()).projects).toHaveLength(projects.length);
    expect(await client.tloz.getProjects()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: projects[0].id, color: projects[0].color })
    ]));
    expect(await client.tloz.getSeasons()).toHaveLength(seasons.length);
    expect(await client.tloz.getEpisodes()).toHaveLength(episodes.length);
    expect(await client.tloz.getQuestItems()).toHaveLength(questItems.length);
    expect(await client.tloz.getResources()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "resource-ui", icon: "FileCheck" })]));
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
    const { createdAt: _createdAt, updatedAt: _updatedAt, completedAt: _completedAt, displayId: _displayId, ...input } = missions[0];
    const created = await client.tloz.createMission({ ...input, id: "prisma-test", title: "Created", projectId: missions[0].projectId! });
    expect(created.title).toBe("Created");
    const updated = await client.tloz.updateMission(created.id, { title: "Updated", startDate: "2026-07-01" });
    expect(updated).toMatchObject({ title: "Updated", startDate: "2026-07-01" });
    expect((await client.tloz.patchMissionStatus(created.id, "completed")).completedAt).toBeTruthy();
    await client.tloz.deleteMission(created.id);
    expect(await client.tloz.getMissionDetail(created.id)).toBeNull();
  });

  it("materializes Markdown checkboxes atomically during mission creation", async () => {
    const client = createPrismaDataClient(createPrismaStub());
    const template = missions[0];
    const created = await client.tloz.createMission({
      id: "prisma-checklist-test",
      title: "Mission with outcomes",
      description: "Short outcome",
      descriptionDetail: "- [x] First outcome\n- [ ] Second outcome",
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

  it("persists resource icons in the same Prisma mission transaction", async () => {
    const client = createPrismaDataClient(createPrismaStub());
    const template = missions[0];
    const created = await client.tloz.createMission({
      id: "prisma-resource-icon-test",
      title: "Mission with icon resource",
      type: "side_quest",
      ownerId: template.ownerId,
      projectId: template.projectId!,
      resources: [{ type: "link", title: "Repository", url: "https://github.com/org/repo", icon: "Github" }],
    });

    expect((await client.tloz.getMissionDetail(created.id))?.resources).toEqual([
      expect.objectContaining({ title: "Repository", icon: "Github" }),
    ]);
  });
});
