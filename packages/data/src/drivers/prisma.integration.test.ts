import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaDataClient } from "./prisma";
import type { ZipformDataClient } from "../contracts";

const SCHEMA_DIR = resolve(import.meta.dirname ?? __dirname, "../../prisma");

function getTestDbUrl(): string | null {
  return process.env.TEST_DATABASE_URL || null;
}

function skipIfNoDb() {
  const url = getTestDbUrl();
  if (!url) {
    return {
      url: null,
      skip: (reason: string) => {
        it.skip(reason, () => {});
      },
    };
  }
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  return { url, prisma };
}

function runMigrations(url: string) {
  try {
    execSync(
      `prisma migrate deploy --schema "${SCHEMA_DIR}/schema.prisma"`,
      {
        env: {
          ...process.env,
          DATABASE_URL: url,
          DIRECT_URL: url,
        },
        stdio: "pipe",
        cwd: resolve(SCHEMA_DIR, ".."),
      }
    );
  } catch {
    // migrations may already be applied; try db push as fallback
    execSync(
      `prisma db push --schema "${SCHEMA_DIR}/schema.prisma" --accept-data-loss`,
      {
        env: {
          ...process.env,
          DATABASE_URL: url,
          DIRECT_URL: url,
        },
        stdio: "pipe",
        cwd: resolve(SCHEMA_DIR, ".."),
      }
    );
  }
}

async function seedReferenceData(prisma: PrismaClient) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  await prisma.user.createMany({
    data: [
      {
        id: "int-user-benji",
        name: "Benji",
        username: "benji",
        email: "benji@zipform.local",
        role: "admin",
        avatarUrl: "/avatars/benji.png",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "int-user-raul",
        name: "Raul",
        username: "raul",
        email: "raul@zipform.local",
        role: "member",
        avatarUrl: "/avatars/raul.png",
        createdAt: now,
        updatedAt: now,
      },
    ],
  });

  await prisma.session.create({
    data: {
      id: "int-session",
      userId: "int-user-benji",
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.tlozSeason.create({
    data: {
      id: "int-season-1",
      name: "Season 1",
      version: "1.0",
      description: "Integration test season",
      status: "active",
      startDate: today,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.tlozProject.create({
    data: {
      id: "int-project-core",
      slug: "int-core",
      name: "Core",
      description: "Integration test project",
      descriptionDetail: "",
      color: "#2D6CDF",
      icon: "Sword",
      status: "active",
      type: "normal",
      ownerId: "int-user-benji",
      startDate: today,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.tlozProject.create({
    data: {
      id: "int-project-growth",
      slug: "int-growth",
      name: "Growth",
      description: "Growth project",
      descriptionDetail: "",
      color: "#10B981",
      icon: "TrendingUp",
      status: "active",
      type: "normal",
      ownerId: "int-user-benji",
      startDate: today,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function cleanDatabase(prisma: PrismaClient) {
  await prisma.tlozUserMissionState.deleteMany();
  await prisma.tlozResource.deleteMany();
  await prisma.tlozChecklistItem.deleteMany();
  await prisma.tlozMissionQuestItem.deleteMany();
  await prisma.tlozMissionDependency.deleteMany();
  await prisma.tlozQuestItem.deleteMany();
  await prisma.tlozMission.deleteMany();
  await prisma.tlozEpisode.deleteMany();
  await prisma.tlozSeason.deleteMany();
  await prisma.tlozProject.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function cleanMissionsOnly(prisma: PrismaClient) {
  await prisma.tlozUserMissionState.deleteMany();
  await prisma.tlozResource.deleteMany();
  await prisma.tlozChecklistItem.deleteMany();
  await prisma.tlozMissionQuestItem.deleteMany();
  await prisma.tlozMissionDependency.deleteMany();
  await prisma.tlozMission.deleteMany();
}

const testDbUrl = getTestDbUrl();
const hasDb = !!testDbUrl;

const itIf = (condition: boolean) => (condition ? it : it.skip);

describe("prisma integration", () => {
  let client: ZipformDataClient;
  let prisma: PrismaClient;

  beforeAll(async () => {
    if (!testDbUrl) return;
    runMigrations(testDbUrl);
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    await cleanDatabase(prisma);
    await seedReferenceData(prisma);
    client = createPrismaDataClient(prisma);
  }, 60_000);

  afterAll(async () => {
    if (prisma) {
      await cleanDatabase(prisma);
      await prisma.$disconnect();
    }
  });

  describe("read operations", () => {
    itIf(hasDb)("retrieves users", async () => {
      const users = await client.tloz.getUsers();
      expect(users).toHaveLength(2);
      expect(users.map((u) => u.email)).toContain("benji@zipform.local");
    });

    itIf(hasDb)("retrieves projects", async () => {
      const projects = await client.tloz.getProjects();
      expect(projects).toHaveLength(2);
      expect(projects.map((p) => p.name)).toEqual(
        expect.arrayContaining(["Core", "Growth"])
      );
    });

    itIf(hasDb)("returns empty missions list when none exist", async () => {
      const missions = await client.tloz.getMissions();
      expect(missions).toEqual([]);
    });

    itIf(hasDb)("returns null for unknown mission detail", async () => {
      const detail = await client.tloz.getMissionDetail("nonexistent");
      expect(detail).toBeNull();
    });
  });

  describe("CRUD operations", () => {
    itIf(hasDb)("creates a mission with automatic display ID", async () => {
      const mission = await client.tloz.createMission({
        title: "Integration Test Mission",
        description: "Created during integration test",
        icon: "TestTube",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      expect(mission.title).toBe("Integration Test Mission");
      expect(mission.displayId).toMatch(/^COR-\d{4}$/);
      expect(mission.project?.name).toBe("Core");
    });

    itIf(hasDb)("creates missions with sequential display IDs", async () => {
      const first = await client.tloz.createMission({
        title: "First Mission",
        description: "",
        icon: "One",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      const second = await client.tloz.createMission({
        title: "Second Mission",
        description: "",
        icon: "Two",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      expect(first.displayId).toMatch(/^COR-\d{4}$/);
      expect(second.displayId).toMatch(/^COR-\d{4}$/);
      const firstNum = Number(first.displayId.slice(4));
      const secondNum = Number(second.displayId.slice(4));
      expect(secondNum).toBeGreaterThan(firstNum);
    });

    itIf(hasDb)("creates projects with unique slugs", async () => {
      const name = `Project ${Date.now()}`;
      const project = await client.tloz.createProject({
        name,
        description: "",
        icon: "FolderKanban",
        color: "#FF0000",
        status: "active",
        type: "normal",
        ownerId: "int-user-benji",
        startDate: "2026-07-01",
      });
      expect(project.slug).toBeTruthy();

      const withSameName = await client.tloz.createProject({
        name,
        description: "",
        icon: "FolderKanban",
        color: "#00FF00",
        status: "active",
        type: "normal",
        ownerId: "int-user-benji",
        startDate: "2026-07-01",
      });
      expect(withSameName.slug).not.toBe(project.slug);
      expect(withSameName.slug).toMatch(new RegExp(`^${project.slug}-\\d+$`));
    });

    itIf(hasDb)("updates a mission title and description", async () => {
      const mission = await client.tloz.createMission({
        title: "Title to Update",
        description: "Original description",
        icon: "Edit",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      const updated = await client.tloz.updateMission(mission.id, {
        title: "Updated Title",
        description: "Updated description",
      });
      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated description");
    });

    itIf(hasDb)("reassigns mission to a different project with new display ID", async () => {
      const mission = await client.tloz.createMission({
        title: "Reassign Me",
        description: "",
        icon: "Move",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      expect(mission.displayId).toMatch(/^COR/);

      const reassigned = await client.tloz.updateMission(mission.id, {
        projectId: "int-project-growth",
      });
      expect(reassigned.displayId).toMatch(/^GRO/);
      expect(reassigned.project?.name).toBe("Growth");
    });

    itIf(hasDb)("patches mission status to completed", async () => {
      const mission = await client.tloz.createMission({
        title: "Complete Me",
        description: "",
        icon: "Check",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      const completed = await client.tloz.patchMissionStatus(
        mission.id,
        "completed"
      );
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBeTruthy();
    });

    itIf(hasDb)("saves mission document with checklist and progress", async () => {
      const mission = await client.tloz.createMission({
        title: "Doc Test",
        description: "",
        icon: "FileText",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      const markdown = [
        "# Tasks",
        "- [x] Done task",
        "- [ ] Pending task",
        "- [ ] Another pending",
      ].join("\n");

      const detail = await client.tloz.saveMissionDocument(
        mission.id,
        markdown
      );
      expect(detail.descriptionDetail).toBe(markdown);
      expect(detail.checklist).toHaveLength(3);
      expect(detail.checklist[0].completed).toBe(true);
      expect(detail.checklist[1].completed).toBe(false);
      expect(detail.progress).toBe(33);
    });

    itIf(hasDb)("deletes a mission and its related data", async () => {
      const mission = await client.tloz.createMission({
        title: "Delete Me",
        description: "",
        icon: "Trash",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      const missionId = mission.id;

      await client.tloz.saveMissionDocument(missionId, "- [ ] Checklist item");
      await client.tloz.addMissionDependency(
        missionId,
        (await client.tloz.createMission({
          title: "Dependency Target",
          description: "",
          icon: "Link",
          type: "side_quest",
          status: "next",
          ownerId: "int-user-benji",
          projectId: "int-project-core",
          progress: 0,
        })).id
      );

      await client.tloz.deleteMission(missionId);
      const detail = await client.tloz.getMissionDetail(missionId);
      expect(detail).toBeNull();
    });
  });

  describe("dependency management", () => {
    itIf(hasDb)("adds and removes mission dependencies", async () => {
      const a = await client.tloz.createMission({
        title: "Dep A",
        description: "",
        icon: "A",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      const b = await client.tloz.createMission({
        title: "Dep B",
        description: "",
        icon: "B",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });

      const afterAdd = await client.tloz.addMissionDependency(a.id, b.id);
      expect(afterAdd.dependencies).toHaveLength(1);
      expect(afterAdd.dependencies[0].id).toBe(b.id);

      const afterRemove = await client.tloz.removeMissionDependency(
        a.id,
        b.id
      );
      expect(afterRemove.dependencies).toHaveLength(0);
    });

    itIf(hasDb)("rejects cross-project dependencies", async () => {
      const coreMission = await client.tloz.createMission({
        title: "Core Mission",
        description: "",
        icon: "C",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });
      const growthMission = await client.tloz.createMission({
        title: "Growth Mission",
        description: "",
        icon: "G",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-growth",
        progress: 0,
      });

      await expect(
        client.tloz.addMissionDependency(coreMission.id, growthMission.id)
      ).rejects.toThrow();
    });
  });

  describe("transaction correctness", () => {
    itIf(hasDb)("saveMissionDocument atomically replaces checklist items", async () => {
      const mission = await client.tloz.createMission({
        title: "Atomic Doc",
        description: "",
        icon: "Atom",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 0,
      });

      await client.tloz.saveMissionDocument(mission.id, "- [x] First pass");
      const afterFirst = await client.tloz.getMissionDetail(mission.id);
      expect(afterFirst!.checklist).toHaveLength(1);

      await client.tloz.saveMissionDocument(mission.id, [
        "- [ ] Second pass item 1",
        "- [ ] Second pass item 2",
      ].join("\n"));
      const afterSecond = await client.tloz.getMissionDetail(mission.id);
      expect(afterSecond!.checklist).toHaveLength(2);
      expect(afterSecond!.checklist[0].title).toBe("Second pass item 1");
    });

    itIf(hasDb)("updateMission atomically replaces document checklist and progress", async () => {
      const mission = await client.tloz.createMission({
        title: "Generic document update",
        description: "Before",
        descriptionDetail: "- [x] Existing",
        icon: "Atom",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 100,
      });

      await client.tloz.updateMission(mission.id, {
        description: "After",
        descriptionDetail: "- [x] Added\n- [ ] Changed\n- [ ] Removed next",
        progress: 100,
      });
      const updated = await client.tloz.getMissionDetail(mission.id);
      expect(updated).toMatchObject({ description: "After", progress: 33, checklistCount: 3, completed: 1 });
      expect(updated!.checklist.map((item) => item.title)).toEqual(["Added", "Changed", "Removed next"]);

      await client.tloz.updateMission(mission.id, { descriptionDetail: "No tasks remain" });
      const cleared = await client.tloz.getMissionDetail(mission.id);
      expect(cleared).toMatchObject({ progress: 0, checklistCount: 0, completed: 0 });
    });

    itIf(hasDb)("rolls back a mixed document update when validation fails", async () => {
      const mission = await client.tloz.createMission({
        title: "Rollback document update",
        description: "Before",
        descriptionDetail: "- [x] Stable",
        icon: "Shield",
        type: "side_quest",
        status: "next",
        ownerId: "int-user-benji",
        projectId: "int-project-core",
        progress: 100,
      });

      await expect(client.tloz.updateMission(mission.id, {
        projectId: "missing-project",
        description: "Must roll back",
        descriptionDetail: "- [ ] Must roll back",
      })).rejects.toThrow("project was not found");

      const unchanged = await client.tloz.getMissionDetail(mission.id);
      expect(unchanged).toMatchObject({ description: "Before", descriptionDetail: "- [x] Stable", progress: 100 });
      expect(unchanged!.checklist).toEqual([expect.objectContaining({ title: "Stable", completed: true })]);
    });
  });

  describe("concurrent-safe identifiers", () => {
    itIf(hasDb)("handles concurrent project creation with unique slugs", async () => {
      const name = `Concurrent ${Date.now()}`;
      const results = await Promise.all([
        client.tloz.createProject({
          name,
          description: "",
          icon: "FolderKanban",
          color: "#FF0000",
          status: "active",
          type: "normal",
          ownerId: "int-user-benji",
          startDate: "2026-07-01",
        }),
        client.tloz.createProject({
          name,
          description: "",
          icon: "FolderKanban",
          color: "#00FF00",
          status: "active",
          type: "normal",
          ownerId: "int-user-benji",
          startDate: "2026-07-01",
        }),
        client.tloz.createProject({
          name,
          description: "",
          icon: "FolderKanban",
          color: "#0000FF",
          status: "active",
          type: "normal",
          ownerId: "int-user-benji",
          startDate: "2026-07-01",
        }),
      ]);
      const slugs = results.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(3);
    });

    itIf(hasDb)("handles concurrent mission creation with unique display IDs", async () => {
      const results = await Promise.all([
        client.tloz.createMission({
          title: "Concurrent Mission 1",
          description: "",
          icon: "One",
          type: "side_quest",
          status: "next",
          ownerId: "int-user-benji",
          projectId: "int-project-core",
          progress: 0,
        }),
        client.tloz.createMission({
          title: "Concurrent Mission 2",
          description: "",
          icon: "Two",
          type: "side_quest",
          status: "next",
          ownerId: "int-user-benji",
          projectId: "int-project-core",
          progress: 0,
        }),
        client.tloz.createMission({
          title: "Concurrent Mission 3",
          description: "",
          icon: "Three",
          type: "side_quest",
          status: "next",
          ownerId: "int-user-benji",
          projectId: "int-project-core",
          progress: 0,
        }),
      ]);
      const displayIds = results.map((m) => m.displayId);
      expect(new Set(displayIds).size).toBe(3);
      displayIds.forEach((id) => expect(id).toMatch(/^COR-\d{4}$/));
    });
  });
});

if (!hasDb) {
  describe("prisma integration", () => {
    it.skip("set TEST_DATABASE_URL to run integration tests", () => {});
  });
}
