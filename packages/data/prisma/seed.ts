import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import {
  agentApiKeys,
  checklistItems,
  currentUser,
  episodes,
  metrics,
  missionDependencies,
  missionQuestItems,
  missions,
  projects,
  questItems,
  resources,
  seasons,
  userMissionStates,
  users
} from "../src/seed-data";

const prisma = new PrismaClient();

const date = (value: string) => new Date(value);

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function hashKey(key: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(key, salt, 64).toString("hex")}`;
}

async function main() {
  await prisma.$transaction([
    prisma.tlozUserMissionState.deleteMany(),
    prisma.tlozResource.deleteMany(),
    prisma.tlozChecklistItem.deleteMany(),
    prisma.tlozMissionQuestItem.deleteMany(),
    prisma.tlozMissionDependency.deleteMany(),
    prisma.tlozQuestItem.deleteMany(),
    prisma.tlozMission.deleteMany(),
    prisma.tlozEpisode.deleteMany(),
    prisma.tlozSeason.deleteMany(),
    prisma.tlozProject.deleteMany(),
    prisma.session.deleteMany(),
    prisma.platformMetric.deleteMany(),
    prisma.user.deleteMany()
  ]);

  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      passwordHash: user.id === currentUser.id ? hashPassword("changeme") : null,
      createdAt: date("2026-06-24T16:00:00.000Z"),
      updatedAt: date("2026-06-24T16:00:00.000Z")
    }))
  });

  await prisma.session.create({
    data: {
      id: "session-local",
      userId: currentUser.id,
      createdAt: date("2026-06-24T16:00:00.000Z"),
      updatedAt: date("2026-06-24T16:00:00.000Z")
    }
  });

  await prisma.apiKey.createMany({
    data: agentApiKeys.map((key) => ({
      id: key.id,
      userId: key.userId,
      createdByUserId: key.createdByUserId,
      name: key.name,
      keyPrefix: key.keyPrefix,
      keyHash: hashKey(key.rawKey),
      lastUsedAt: null,
      expiresAt: null,
      createdAt: date(key.createdAt),
      updatedAt: date(key.updatedAt)
    }))
  });

  await prisma.platformMetric.createMany({
    data: metrics.map((metric, index) => ({
      id: `metric-${index + 1}`,
      ...metric,
      position: index + 1,
      createdAt: date("2026-06-24T16:00:00.000Z"),
      updatedAt: date("2026-06-24T16:00:00.000Z")
    }))
  });

  await prisma.tlozSeason.createMany({
    data: seasons.map((season) => ({
      ...season,
      createdAt: date(season.createdAt),
      updatedAt: date(season.updatedAt)
    }))
  });

  await prisma.tlozEpisode.createMany({
    data: episodes.map((episode) => ({
      ...episode,
      createdAt: date(episode.createdAt),
      updatedAt: date(episode.updatedAt)
    }))
  });

  await prisma.tlozProject.createMany({
    data: projects.map((project) => ({
      ...project,
      createdAt: date(project.createdAt),
      updatedAt: date(project.updatedAt)
    }))
  });

  await prisma.tlozQuestItem.createMany({
    data: questItems.map((item) => ({
      ...item,
      acquiredAt: item.acquiredAt ?? null,
      createdAt: date(item.createdAt),
      updatedAt: date(item.updatedAt)
    }))
  });

  await prisma.tlozMission.createMany({
    data: missions.map((mission) => ({
      ...mission,
      conclusion: mission.conclusion ?? null,
      seasonId: mission.seasonId ?? null,
      episodeId: mission.episodeId ?? null,
      dueDate: mission.dueDate ?? null,
      startDate: mission.startDate ?? null,
      completedAt: mission.completedAt ? date(mission.completedAt) : null,
      blockedReason: mission.blockedReason ?? null,
      createdAt: date(mission.createdAt),
      updatedAt: date(mission.updatedAt)
    }))
  });

  await prisma.tlozMissionDependency.createMany({
    data: missionDependencies.map((dependency) => ({
      ...dependency,
      createdAt: date(dependency.createdAt)
    }))
  });

  await prisma.tlozMissionQuestItem.createMany({
    data: missionQuestItems.map((item) => ({
      ...item,
      createdAt: date(item.createdAt)
    }))
  });

  await prisma.tlozChecklistItem.createMany({
    data: checklistItems.map((item) => ({
      ...item,
      createdAt: date(item.createdAt),
      updatedAt: date(item.updatedAt)
    }))
  });

  await prisma.tlozResource.createMany({
    data: resources.map((resource) => ({
      ...resource,
      url: resource.url ?? null,
      fileId: resource.fileId ?? null,
      createdAt: date(resource.createdAt),
      updatedAt: date(resource.updatedAt)
    }))
  });

  await prisma.tlozUserMissionState.createMany({
    data: userMissionStates.map((state) => ({
      ...state,
      createdAt: date(state.createdAt),
      updatedAt: date(state.updatedAt)
    }))
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
