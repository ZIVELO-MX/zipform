import { type Prisma, type PrismaClient } from "@prisma/client";
import type { PaginationInput, PaginatedResult, TlozActivityEvent, TlozActivityInput, TlozActivityRepository } from "./contracts";

function clampLimit(limit = 25) {
  return Math.min(Math.max(limit, 1), 100);
}

export function createPrismaActivityRepository(prisma: PrismaClient): TlozActivityRepository {
  return {
    async list(contentId, pagination = {}) {
      const limit = clampLimit(pagination.limit);
      const rows = await prisma.tlozActivityEvent.findMany({
        where: { contentId },
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
      const row = await prisma.tlozActivityEvent.create({ data: {
        contentId: input.contentId,
        actorId: input.actorId,
        action: input.action,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        idempotencyKey: input.idempotencyKey,
      } });
      return mapActivity(row);
    },
  };
}

function mapActivity(row: { id: string; contentId: string; actorId: string; action: string; metadata: unknown; occurredAt: Date }): TlozActivityEvent {
  return { id: row.id, contentId: row.contentId, actorId: row.actorId, action: row.action, metadata: (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata : {}) as Record<string, unknown>, occurredAt: row.occurredAt.toISOString() };
}

export function createMockActivityRepository(): TlozActivityRepository {
  const events: TlozActivityEvent[] = [];
  const idempotency = new Map<string, TlozActivityEvent>();
  return {
    async list(contentId, pagination = {}) {
      const limit = clampLimit(pagination.limit);
      const filtered = events.filter((event) => event.contentId === contentId).slice().reverse();
      const start = pagination.cursor ? Math.max(0, filtered.findIndex((event) => event.id === pagination.cursor) + 1) : 0;
      const page = filtered.slice(start, start + limit);
      return { data: page, nextCursor: start + page.length < filtered.length ? page.at(-1)?.id ?? null : null };
    },
    async append(input) {
      const existing = input.idempotencyKey ? idempotency.get(input.idempotencyKey) : undefined;
      if (existing) return existing;
      const event = { id: crypto.randomUUID(), contentId: input.contentId, actorId: input.actorId, action: input.action, metadata: input.metadata ?? {}, occurredAt: new Date().toISOString() };
      events.push(event);
      if (input.idempotencyKey) idempotency.set(input.idempotencyKey, event);
      return event;
    },
  };
}
