import { Prisma, type PrismaClient } from "@prisma/client";
import type { PaginationInput, PaginatedResult, TlozActivityEvent, TlozActivityInput, TlozActivityRepository } from "./contracts";

function clampLimit(limit = 25) {
  return Math.min(Math.max(limit, 1), 100);
}

export function createPrismaActivityRepository(prisma: PrismaClient): TlozActivityRepository {
  return {
    async list(entityId, pagination = {}) {
      const limit = clampLimit(pagination.limit);
      const rows = await prisma.tlozActivityEvent.findMany({
        where: { entityId },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(pagination.cursor ? { skip: 1, cursor: { id: pagination.cursor } } : {}),
      });
      const page = rows.slice(0, limit);
      return { data: page.map(mapActivity), nextCursor: rows.length > limit ? page.at(-1)?.id ?? null : null };
    },
    async append(input) {
      if (input.idempotencyKey) {
        const existing = await prisma.tlozActivityEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (existing) return mapActivity(existing);
      }
      try {
        const row = await prisma.tlozActivityEvent.create({ data: {
          contentId: input.contentId,
          entityType: input.entityType,
          entityId: input.entityId,
          entityPublicId: input.entityPublicId,
          actorId: input.actorId,
          action: input.action,
          source: input.source,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
          idempotencyKey: input.idempotencyKey,
        } });
        return mapActivity(row);
      } catch (error) {
        if (input.idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const existing = await prisma.tlozActivityEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
          if (existing) return mapActivity(existing);
        }
        throw error;
      }
    },
  };
}

function mapActivity(row: { id: string; contentId: string | null; entityType: string; entityId: string; entityPublicId: string; actorId: string; action: string; source: string; metadata: unknown; occurredAt: Date }): TlozActivityEvent {
  return { id: row.id, contentId: row.contentId, entityType: row.entityType, entityId: row.entityId, entityPublicId: row.entityPublicId, actorId: row.actorId, action: row.action, source: row.source as TlozActivityEvent["source"], metadata: (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata : {}) as Record<string, unknown>, occurredAt: row.occurredAt.toISOString() };
}

export function createMockActivityRepository(): TlozActivityRepository {
  const events: TlozActivityEvent[] = [];
  const idempotency = new Map<string, TlozActivityEvent>();
  return {
    async list(entityId, pagination = {}) {
      const limit = clampLimit(pagination.limit);
      const filtered = events.filter((event) => event.entityId === entityId).slice().reverse();
      const start = pagination.cursor ? Math.max(0, filtered.findIndex((event) => event.id === pagination.cursor) + 1) : 0;
      const page = filtered.slice(start, start + limit);
      return { data: page, nextCursor: start + page.length < filtered.length ? page.at(-1)?.id ?? null : null };
    },
    async append(input) {
      const existing = input.idempotencyKey ? idempotency.get(input.idempotencyKey) : undefined;
      if (existing) return existing;
      const event: TlozActivityEvent = { id: crypto.randomUUID(), contentId: input.contentId ?? null, entityType: input.entityType, entityId: input.entityId, entityPublicId: input.entityPublicId, actorId: input.actorId, action: input.action, source: input.source, metadata: input.metadata ?? {}, occurredAt: new Date().toISOString() };
      events.push(event);
      if (input.idempotencyKey) idempotency.set(input.idempotencyKey, event);
      return event;
    },
  };
}
