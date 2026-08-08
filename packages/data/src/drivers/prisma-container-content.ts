import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  ContainerDefinition,
  ContainerRecord,
  ContentRecord,
} from "@tloz/types";
import {
  ContainerContentError,
  canonicalContainerContentJson,
  type ContainerContentSnapshot,
  type ContainerContentStore,
  type ContainerCreateInput,
  type ContentCreateInput,
  type ContentFilters,
  type ContentUpdate,
  type MigrationReport,
  getContentReferenceIds,
  validateContainerRecord,
  validateContentRecord,
} from "../container-content-store";
import { checksumContainerContentSnapshot } from "../container-content-checksum";

type DbClient = PrismaClient | Prisma.TransactionClient;

const toJson = (value: unknown) => value as Prisma.InputJsonValue;
const toIso = (value: Date) => value.toISOString();

function mapContainer(row: {
  id: string;
  publicId: string;
  slug: string | null;
  presentation: string;
  title: string;
  summary: string;
  body: string;
  definition: Prisma.JsonValue;
  data: Prisma.JsonValue;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}): ContainerRecord {
  return {
    ...row,
    slug: row.slug ?? undefined,
    definition: row.definition as ContainerDefinition,
    data: row.data as ContainerRecord["data"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapContent(row: {
  id: string;
  publicId: string;
  containerId: string;
  presentation: string;
  title: string;
  summary: string;
  body: string;
  data: Prisma.JsonValue;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}): ContentRecord {
  return {
    ...row,
    data: row.data as ContentRecord["data"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function commonData(record: ContainerRecord | ContentRecord) {
  return {
    publicId: record.publicId.trim(),
    presentation: record.presentation.trim(),
    title: record.title.trim(),
    summary: record.summary,
    body: record.body,
    data: toJson(record.data),
    revision: record.revision,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

function translatePrismaError(error: unknown): never {
  if (error instanceof ContainerContentError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      throw new ContainerContentError("STORE_NOT_FOUND", "El registro no existe.", {}, { cause: error });
    }
    if (error.code === "P2003") {
      throw new ContainerContentError(
        "STORE_REFERENCE_INVALID",
        "El Container referenciado no existe.",
        { containerId: "not_found" },
        { cause: error },
      );
    }
    if (error.code === "P2002") {
      throw new ContainerContentError(
        "STORE_INVALID",
        "La identidad pública ya está en uso.",
        { publicId: "duplicate" },
        { cause: error },
      );
    }
  }
  throw new ContainerContentError(
    "STORE_UNAVAILABLE",
    "El store Container/Content no está disponible.",
    {},
    { cause: error },
  );
}

export function createPrismaContainerContentStore(prisma: PrismaClient): ContainerContentStore {
  async function exportFrom(client: DbClient): Promise<ContainerContentSnapshot> {
    const [containers, contents] = await Promise.all([
      client.container.findMany({ orderBy: { id: "asc" } }),
      client.content.findMany({ orderBy: { id: "asc" } }),
    ]);
    return {
      containers: containers.map(mapContainer),
      contents: contents.map(mapContent),
    };
  }

  return {
    async createContainer(input: ContainerCreateInput) {
      const now = new Date();
      const record = { ...input, id: input.id ?? crypto.randomUUID(), revision: 1, createdAt: now.toISOString(), updatedAt: now.toISOString() } as ContainerRecord;
      validateContainerRecord(record);
      try {
        return mapContainer(await prisma.container.create({ data: {
          id: record.id, publicId: record.publicId.trim(), slug: record.slug,
          presentation: record.presentation.trim(), title: record.title.trim(),
          summary: record.summary, body: record.body, definition: toJson(record.definition),
          data: toJson(record.data), revision: 1, createdAt: now, updatedAt: now,
        } }));
      } catch (error) { return translatePrismaError(error); }
    },

    async createContent(input: ContentCreateInput) {
      const now = new Date();
      const record = { ...input, id: input.id ?? crypto.randomUUID(), revision: 1, createdAt: now.toISOString(), updatedAt: now.toISOString() } as ContentRecord;
      validateContentRecord(record);
      try {
        const references = getContentReferenceIds(record);
        if (references.length) {
          const unique = new Set(references);
          const count = await prisma.content.count({ where: { id: { in: [...unique] } } });
          if (count !== unique.size) throw new ContainerContentError("STORE_REFERENCE_INVALID", "Una relación referencia Content inexistente.", { relations: "not_found" });
        }
        return mapContent(await prisma.content.create({ data: {
          id: record.id, publicId: record.publicId.trim(), containerId: record.containerId,
          presentation: record.presentation.trim(), title: record.title.trim(), summary: record.summary,
          body: record.body, data: toJson(record.data), revision: 1, createdAt: now, updatedAt: now,
        } }));
      } catch (error) { return translatePrismaError(error); }
    },

    async migrate(snapshot): Promise<MigrationReport> {
      for (const container of snapshot.containers) validateContainerRecord(container);
      const containerIds = new Set(snapshot.containers.map(({ id }) => id));
      for (const content of snapshot.contents) {
        validateContentRecord(content);
        if (!containerIds.has(content.containerId)) {
          throw new ContainerContentError(
            "STORE_REFERENCE_INVALID",
            `Container ${content.containerId} no existe en el snapshot.`,
            { containerId: "not_found" },
          );
        }
        for (const targetId of getContentReferenceIds(content)) {
          if (!snapshot.contents.some(({ id }) => id === targetId)) {
            throw new ContainerContentError(
              "STORE_REFERENCE_INVALID",
              `Content ${targetId} no existe en el snapshot.`,
              { relations: "not_found" },
            );
          }
        }
      }

      try {
        return await prisma.$transaction(async (tx) => {
          let inserted = 0;
          let updated = 0;
          let unchanged = 0;

          for (const container of snapshot.containers) {
            const current = await tx.container.findUnique({ where: { id: container.id } });
            if (!current) inserted += 1;
            else if (
              canonicalContainerContentJson(mapContainer(current))
              === canonicalContainerContentJson(container)
            ) unchanged += 1;
            else updated += 1;
            await tx.container.upsert({
              where: { id: container.id },
              create: {
                id: container.id,
                ...commonData(container),
                slug: container.slug,
                definition: toJson(container.definition),
              },
              update: {
                ...commonData(container),
                slug: container.slug,
                definition: toJson(container.definition),
              },
            });
          }

          for (const content of snapshot.contents) {
            const current = await tx.content.findUnique({ where: { id: content.id } });
            if (!current) inserted += 1;
            else if (
              canonicalContainerContentJson(mapContent(current))
              === canonicalContainerContentJson(content)
            ) unchanged += 1;
            else updated += 1;
            await tx.content.upsert({
              where: { id: content.id },
              create: { id: content.id, containerId: content.containerId, ...commonData(content) },
              update: { containerId: content.containerId, ...commonData(content) },
            });
          }

          return {
            inserted,
            updated,
            unchanged,
            checksum: checksumContainerContentSnapshot(await exportFrom(tx)),
          };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          // Backfill processes the legacy snapshot row-by-row. Prisma's default
          // five-second interactive transaction timeout is too short for the
          // production dataset (currently 161 records).
          maxWait: 30_000,
          timeout: 120_000,
        });
      } catch (error) {
        return translatePrismaError(error);
      }
    },

    async getContainer(id) {
      try {
        const row = await prisma.container.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
        return row ? mapContainer(row) : null;
      } catch (error) {
        return translatePrismaError(error);
      }
    },

    async getContent(id) {
      try {
        const row = await prisma.content.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
        return row ? mapContent(row) : null;
      } catch (error) {
        return translatePrismaError(error);
      }
    },

    async listContainers(filters = {}) {
      try {
        const rows = await prisma.container.findMany({ where: { presentation: filters.presentation }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }] });
        return rows.map(mapContainer);
      } catch (error) { return translatePrismaError(error); }
    },

    async listContents(filters: ContentFilters = {}) {
      try {
        const rows = await prisma.content.findMany({
          where: {
            containerId: filters.containerId,
            presentation: filters.presentation,
            ...(filters.data ? {
              AND: Object.entries(filters.data).map(([key, value]) => ({
                data: { path: [key], equals: toJson(value) },
              })),
            } : {}),
          },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        });
        return rows.map(mapContent);
      } catch (error) {
        return translatePrismaError(error);
      }
    },

    async findContainers(filters = {}, pagination = {}) {
      try {
        const limit = Math.min(Math.max(pagination.limit ?? 25, 1), 100);
        const rows = await prisma.container.findMany({
          where: { presentation: filters.presentation },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: limit + 1,
          ...(pagination.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
        });
        const data = rows.slice(0, limit).map(mapContainer);
        return { data, nextCursor: rows.length > limit ? data.at(-1)?.id ?? null : null };
      } catch (error) {
        return translatePrismaError(error);
      }
    },

    async findContents(filters: ContentFilters = {}, pagination = {}) {
      try {
        const limit = Math.min(Math.max(pagination.limit ?? 25, 1), 100);
        const rows = await prisma.content.findMany({
          where: {
            containerId: filters.containerId,
            presentation: filters.presentation,
            ...(filters.data ? {
              AND: Object.entries(filters.data).map(([key, value]) => ({
                data: { path: [key], equals: toJson(value) },
              })),
            } : {}),
          },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: limit + 1,
          ...(pagination.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
        });
        const data = rows.slice(0, limit).map(mapContent);
        return { data, nextCursor: rows.length > limit ? data.at(-1)?.id ?? null : null };
      } catch (error) {
        return translatePrismaError(error);
      }
    },

    async updateContent(id: string, update: ContentUpdate, expectedRevision: number) {
      if (update.title !== undefined && !update.title.trim()) {
        throw new ContainerContentError("STORE_INVALID", "El título no puede estar vacío.", {
          title: "required",
        });
      }
      try {
        const current = await prisma.content.findUnique({ where: { id } });
        if (!current) {
          throw new ContainerContentError("STORE_NOT_FOUND", `Content ${id} no existe.`, {
            id: "not_found",
          });
        }
        if (current.revision !== expectedRevision) {
          throw new ContainerContentError(
            "STORE_REVISION_CONFLICT",
            "La revisión ya no está vigente.",
            { revision: "conflict" },
          );
        }
        const mergedData = update.data
          ? { ...(current.data as ContentRecord["data"]), ...update.data }
          : undefined;
        if (mergedData) {
          const candidate = mapContent({ ...current, data: mergedData });
          const referenceIds = getContentReferenceIds(candidate);
          const referenceCount = await prisma.content.count({
            where: { id: { in: [...new Set(referenceIds)] } },
          });
          if (referenceCount !== new Set(referenceIds).size) {
            throw new ContainerContentError(
              "STORE_REFERENCE_INVALID",
              "Una relación referencia Content inexistente.",
              { relations: "not_found" },
            );
          }
        }
        const result = await prisma.content.updateMany({
          where: { id, revision: expectedRevision },
          data: {
            title: update.title?.trim(),
            summary: update.summary,
            body: update.body,
            presentation: update.presentation,
            data: mergedData ? toJson(mergedData) : undefined,
            revision: { increment: 1 },
          },
        });
        if (result.count === 0) {
          const exists = await prisma.content.findUnique({ where: { id }, select: { id: true } });
          throw new ContainerContentError(
            exists ? "STORE_REVISION_CONFLICT" : "STORE_NOT_FOUND",
            exists ? "La revisión ya no está vigente." : `Content ${id} no existe.`,
            exists ? { revision: "conflict" } : { id: "not_found" },
          );
        }
        return mapContent(await prisma.content.findUniqueOrThrow({ where: { id } }));
      } catch (error) {
        return translatePrismaError(error);
      }
    },

    async updateContainer(id, update, expectedRevision) {
      if (update.title !== undefined && !update.title.trim()) {
        throw new ContainerContentError("STORE_INVALID", "El título no puede estar vacío.", { title: "required" });
      }
      try {
        const current = await prisma.container.findUnique({ where: { id } });
        if (!current) throw new ContainerContentError("STORE_NOT_FOUND", `Container ${id} no existe.`, { id: "not_found" });
        if (current.revision !== expectedRevision) throw new ContainerContentError("STORE_REVISION_CONFLICT", "La revisión ya no está vigente.", { revision: "conflict" });
        const mergedData = update.data ? { ...(current.data as ContainerRecord["data"]), ...update.data } : undefined;
        const result = await prisma.container.updateMany({
          where: { id, revision: expectedRevision },
          data: {
            slug: update.slug,
            presentation: update.presentation?.trim(),
            title: update.title?.trim(),
            summary: update.summary,
            body: update.body,
            definition: update.definition ? toJson(update.definition) : undefined,
            data: mergedData ? toJson(mergedData) : undefined,
            revision: { increment: 1 },
          },
        });
        if (result.count === 0) {
          const exists = await prisma.container.findUnique({ where: { id }, select: { id: true } });
          throw new ContainerContentError(exists ? "STORE_REVISION_CONFLICT" : "STORE_NOT_FOUND", exists ? "La revisión ya no está vigente." : `Container ${id} no existe.`, exists ? { revision: "conflict" } : { id: "not_found" });
        }
        return mapContainer(await prisma.container.findUniqueOrThrow({ where: { id } }));
      } catch (error) { return translatePrismaError(error); }
    },

    async deleteContent(id, expectedRevision) {
      try {
        const result = await prisma.content.deleteMany({ where: { id, revision: expectedRevision } });
        if (result.count === 0) {
          const exists = await prisma.content.findUnique({ where: { id }, select: { id: true } });
          throw new ContainerContentError(exists ? "STORE_REVISION_CONFLICT" : "STORE_NOT_FOUND", exists ? "La revisión ya no está vigente." : `Content ${id} no existe.`, exists ? { revision: "conflict" } : { id: "not_found" });
        }
      } catch (error) { return translatePrismaError(error); }
    },

    async deleteContainer(id, expectedRevision) {
      try {
        const result = await prisma.container.deleteMany({ where: { id, revision: expectedRevision } });
        if (result.count === 0) {
          const exists = await prisma.container.findUnique({ where: { id }, select: { id: true } });
          throw new ContainerContentError(exists ? "STORE_REVISION_CONFLICT" : "STORE_NOT_FOUND", exists ? "La revisión ya no está vigente." : `Container ${id} no existe.`, exists ? { revision: "conflict" } : { id: "not_found" });
        }
      } catch (error) { return translatePrismaError(error); }
    },

    async exportSnapshot() {
      try {
        return await exportFrom(prisma);
      } catch (error) {
        return translatePrismaError(error);
      }
    },
  };
}
