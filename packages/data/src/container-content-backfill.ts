import type { PrismaClient } from "@prisma/client";
import type {
  ContainerContentData,
  ContainerDefinition,
  ContainerRecord,
  ContentRecord,
} from "@tloz/types";
import {
  canonicalContainerContentJson,
  ContainerContentError,
  type ContainerContentSnapshot,
} from "./container-content-store";
import { checksumContainerContentSnapshot } from "./container-content-checksum";
import { createPrismaContainerContentStore } from "./drivers/prisma-container-content";

const EMPTY_DEFINITION: ContainerDefinition = {
  fields: [],
  views: [{ id: "default", fields: [] }],
  defaultView: "default",
};

const SYSTEM_INVENTORY_ID = "system-inventory";
const SYSTEM_PLANNING_ID = "system-planning";

const iso = (date: Date) => date.toISOString();

function values(value: unknown): ContainerContentData {
  return JSON.parse(JSON.stringify(value)) as ContainerContentData;
}

function resourcesFor(
  resources: Array<Record<string, unknown>>,
  owner: "projectId" | "missionId" | "questItemId",
  id: string,
) {
  return resources
    .filter((resource) => resource[owner] === id)
    .map(({ documentId: _documentId, projectId: _projectId, missionId: _missionId, questItemId: _questItemId, ...resource }) => resource);
}

export async function buildLegacyContainerContentSnapshot(
  prisma: PrismaClient,
): Promise<ContainerContentSnapshot> {
  const [projects, missions, questItems, seasons, episodes, resources, dependencies, checklist, documents, definitions] =
    await Promise.all([
      prisma.tlozProject.findMany({ orderBy: { id: "asc" } }),
      prisma.tlozMission.findMany({ orderBy: { id: "asc" } }),
      prisma.tlozQuestItem.findMany({ orderBy: { id: "asc" } }),
      prisma.tlozSeason.findMany({ orderBy: { id: "asc" } }),
      prisma.tlozEpisode.findMany({ orderBy: { id: "asc" } }),
      prisma.tlozResource.findMany({ orderBy: { id: "asc" } }),
      prisma.tlozMissionDependency.findMany({ orderBy: { id: "asc" } }),
      prisma.tlozChecklistItem.findMany({ orderBy: [{ missionId: "asc" }, { position: "asc" }] }),
      prisma.tlozDocument.findMany({
        select: { id: true, sourceType: true, sourceId: true, publicId: true, revision: true },
      }),
      prisma.tlozDocumentDefinition.findMany({ orderBy: { key: "asc" } }),
    ]);

  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const normalizedResources = resources.map((resource) => {
    const owners = [resource.projectId, resource.missionId, resource.questItemId].filter(Boolean);
    if (owners.length > 1) {
      throw new ContainerContentError(
        "STORE_REFERENCE_INVALID",
        `Resource ${resource.id} debe tener exactamente un owner.`,
        { resourceId: "ambiguous_owner" },
      );
    }
    if (owners.length === 1) return resource;

    const document = resource.documentId ? documentsById.get(resource.documentId) : undefined;
    if (!document?.sourceId || !document.sourceType) {
      throw new ContainerContentError(
        "STORE_REFERENCE_INVALID",
        `Resource ${resource.id} no tiene un owner migrable.`,
        { resourceId: "missing_owner" },
      );
    }
    if (document.sourceType === "project") return { ...resource, projectId: document.sourceId };
    if (document.sourceType === "mission") return { ...resource, missionId: document.sourceId };
    if (document.sourceType === "inventory") return { ...resource, questItemId: document.sourceId };
    throw new ContainerContentError(
      "STORE_REFERENCE_INVALID",
      `Resource ${resource.id} referencia un tipo no soportado.`,
      { resourceId: "unsupported_owner" },
    );
  });

  const mirrors = new Map(
    documents
      .filter((document) => document.sourceType && document.sourceId)
      .map((document) => [`${document.sourceType}:${document.sourceId}`, document]),
  );
  const revisionFor = (type: string, id: string) => mirrors.get(`${type}:${id}`)?.revision ?? 1;
  const publicIdFor = (type: string, id: string, fallback: string) =>
    mirrors.get(`${type}:${id}`)?.publicId ?? fallback;
  const definitionFor = (projectId: string): ContainerDefinition => {
    const documentId = mirrors.get(`project:${projectId}`)?.id;
    const definition = definitions.find((item) => item.ownerDocumentId === documentId)
      ?? definitions.find((item) => item.kind === "project" && item.scope === "global");
    if (!definition) return EMPTY_DEFINITION;
    return {
      fields: values(definition.fields) as ContainerDefinition["fields"],
      views: values(definition.views) as ContainerDefinition["views"],
      defaultView: definition.defaultView,
    };
  };

  const timestamps = [...projects, ...missions, ...questItems, ...seasons, ...episodes]
    .flatMap((record) => [record.createdAt, record.updatedAt]);
  const createdAt = timestamps.length
    ? new Date(Math.min(...timestamps.map((date) => date.getTime())))
    : new Date(0);
  const updatedAt = timestamps.length
    ? new Date(Math.max(...timestamps.map((date) => date.getTime())))
    : createdAt;

  const containers: ContainerRecord[] = [
    ...projects.map((project) => ({
      id: project.id,
      publicId: publicIdFor("project", project.id, `project-${project.slug}`),
      slug: project.slug,
      presentation: "project",
      title: project.name,
      summary: project.description,
      body: project.descriptionDetail,
      definition: definitionFor(project.id),
      data: values({
        color: project.color,
        icon: project.icon,
        status: project.status,
        type: project.type,
        ownerId: project.ownerId,
        startDate: project.startDate,
        dueDate: project.dueDate,
        resources: resourcesFor(normalizedResources as unknown as Array<Record<string, unknown>>, "projectId", project.id),
      }) as ContainerRecord["data"],
      revision: revisionFor("project", project.id),
      createdAt: iso(project.createdAt),
      updatedAt: iso(project.updatedAt),
    })),
    {
      id: SYSTEM_INVENTORY_ID,
      publicId: "inventory",
      slug: "inventory",
      presentation: "inventory",
      title: "Inventory",
      summary: "",
      body: "",
      definition: EMPTY_DEFINITION,
      data: {},
      revision: 1,
      createdAt: iso(createdAt),
      updatedAt: iso(updatedAt),
    },
    {
      id: SYSTEM_PLANNING_ID,
      publicId: "planning",
      slug: "planning",
      presentation: "planning",
      title: "Planning",
      summary: "",
      body: "",
      definition: EMPTY_DEFINITION,
      data: {},
      revision: 1,
      createdAt: iso(createdAt),
      updatedAt: iso(updatedAt),
    },
  ];

  const contents: ContentRecord[] = [
    ...missions.map((mission) => ({
      id: mission.id,
      publicId: mission.displayId,
      containerId: mission.projectId ?? SYSTEM_PLANNING_ID,
      presentation: "mission",
      title: mission.title,
      summary: mission.description,
      body: mission.descriptionDetail,
      data: values({
        icon: mission.icon,
        type: mission.type,
        status: mission.status,
        ownerId: mission.ownerId,
        seasonId: mission.seasonId,
        episodeId: mission.episodeId,
        dueDate: mission.dueDate,
        startDate: mission.startDate,
        completedAt: mission.completedAt,
        blockedReason: mission.blockedReason,
        progress: mission.progress,
        checklist: checklist.filter((item) => item.missionId === mission.id),
        relations: dependencies
          .filter((dependency) => dependency.missionId === mission.id)
          .map((dependency) => ({
            contentId: dependency.dependsOnMissionId,
            relation: "depends_on",
          })),
        resources: resourcesFor(normalizedResources as unknown as Array<Record<string, unknown>>, "missionId", mission.id),
      }) as ContentRecord["data"],
      revision: revisionFor("mission", mission.id),
      createdAt: iso(mission.createdAt),
      updatedAt: iso(mission.updatedAt),
    })),
    ...questItems.map((item) => ({
      id: item.id,
      publicId: publicIdFor("quest_item", item.id, `INV-${item.id}`),
      containerId: SYSTEM_INVENTORY_ID,
      presentation: "quest-item",
      title: item.name,
      summary: item.description,
      body: item.descriptionDetail,
      data: values({
        icon: item.icon,
        status: item.status,
        category: item.category,
        ownerId: item.ownerId,
        acquiredAt: item.acquiredAt,
        resources: resourcesFor(normalizedResources as unknown as Array<Record<string, unknown>>, "questItemId", item.id),
      }) as ContentRecord["data"],
      revision: revisionFor("quest_item", item.id),
      createdAt: iso(item.createdAt),
      updatedAt: iso(item.updatedAt),
    })),
    ...seasons.map((season) => ({
      id: season.id,
      publicId: `season-${season.id}`,
      containerId: SYSTEM_PLANNING_ID,
      presentation: "season",
      title: season.name,
      summary: season.description,
      body: "",
      data: values({
        version: season.version,
        status: season.status,
        startDate: season.startDate,
        endDate: season.endDate,
      }) as ContentRecord["data"],
      revision: 1,
      createdAt: iso(season.createdAt),
      updatedAt: iso(season.updatedAt),
    })),
    ...episodes.map((episode) => ({
      id: episode.id,
      publicId: `episode-${episode.id}`,
      containerId: SYSTEM_PLANNING_ID,
      presentation: "episode",
      title: episode.name,
      summary: episode.description,
      body: "",
      data: values({
        seasonId: episode.seasonId,
        romanNumber: episode.romanNumber,
        status: episode.status,
        startDate: episode.startDate,
        endDate: episode.endDate,
      }) as ContentRecord["data"],
      revision: 1,
      createdAt: iso(episode.createdAt),
      updatedAt: iso(episode.updatedAt),
    })),
  ];

  return { containers, contents };
}

export async function backfillContainerContent(
  prisma: PrismaClient,
  apply: boolean,
) {
  const snapshot = await buildLegacyContainerContentSnapshot(prisma);
  const expectedChecksum = checksumContainerContentSnapshot(snapshot);
  if (!apply) {
    return {
      mode: "dry-run" as const,
      containers: snapshot.containers.length,
      contents: snapshot.contents.length,
      checksum: expectedChecksum,
    };
  }
  const report = await createPrismaContainerContentStore(prisma).migrate(snapshot);
  return { mode: "apply" as const, ...report };
}

export async function reconcileContainerContent(prisma: PrismaClient) {
  const expected = await buildLegacyContainerContentSnapshot(prisma);
  const actual = await createPrismaContainerContentStore(prisma).exportSnapshot();
  const expectedChecksum = checksumContainerContentSnapshot(expected);
  const actualChecksum = checksumContainerContentSnapshot(actual);
  const expectedRecords = new Map<string, ContainerRecord | ContentRecord>([
    ...expected.containers.map((record) => [`container:${record.id}`, record] as const),
    ...expected.contents.map((record) => [`content:${record.id}`, record] as const),
  ]);
  const actualRecords = new Map<string, ContainerRecord | ContentRecord>([
    ...actual.containers.map((record) => [`container:${record.id}`, record] as const),
    ...actual.contents.map((record) => [`content:${record.id}`, record] as const),
  ]);
  const mismatches: Array<{
    record: string;
    reason: "unexpected" | "missing" | "different";
    expectedRevision?: number;
    actualRevision?: number;
  }> = [];
  for (const key of [...new Set([...expectedRecords.keys(), ...actualRecords.keys()])].sort()) {
    const expectedRecord = expectedRecords.get(key);
    const actualRecord = actualRecords.get(key);
    if (!expectedRecord) {
      mismatches.push({ record: key, reason: "unexpected" });
    } else if (!actualRecord) {
      mismatches.push({ record: key, reason: "missing" });
    } else if (
      canonicalContainerContentJson(expectedRecord) !== canonicalContainerContentJson(actualRecord)
    ) {
      mismatches.push({
        record: key,
        reason: "different",
        expectedRevision: expectedRecord.revision,
        actualRevision: actualRecord.revision,
      });
    }
  }
  return {
    matches: expectedChecksum === actualChecksum && mismatches.length === 0,
    expectedChecksum,
    actualChecksum,
    expected: { containers: expected.containers.length, contents: expected.contents.length },
    actual: { containers: actual.containers.length, contents: actual.contents.length },
    mismatches,
  };
}
