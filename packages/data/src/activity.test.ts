import { describe, expect, it } from "vitest";
import { createMockActivityRepository } from "./activity";

describe("activity repository", () => {
  it("appends and paginates immutable events", async () => {
    const repository = createMockActivityRepository();
    const first = await repository.append({ contentId: "content-1", actorId: "user-1", action: "content.created" });
    await repository.append({ contentId: "content-1", actorId: "user-1", action: "content.updated" });
    const page = await repository.list("content-1", { limit: 1 });
    expect(page.data).toHaveLength(1);
    expect(page.nextCursor).toBeTruthy();
    expect((await repository.list("content-1", { cursor: page.nextCursor ?? undefined })).data).toHaveLength(1);
    expect((await repository.list("other")).data).toEqual([]);
    expect(first.action).toBe("content.created");
  });

  it("deduplicates a retried command by idempotency key", async () => {
    const repository = createMockActivityRepository();
    const input = { contentId: "content-1", actorId: "user-1", action: "content.updated", idempotencyKey: "request-1" };
    const first = await repository.append(input);
    const retry = await repository.append(input);
    expect(retry).toEqual(first);
    expect((await repository.list("content-1")).data).toHaveLength(1);
  });
});
