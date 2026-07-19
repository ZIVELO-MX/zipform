import { describe, expect, it } from "vitest";
import { createMockDataClient } from "./drivers/mock";
import { TlozAttachmentBatchSupersededError } from "./tloz-attachment-errors";

const file = (key: string, storagePath: string) => ({
  key,
  title: key,
  fileName: `${key}.png`,
  contentType: "image/png" as const,
  sizeBytes: 1024,
  width: 1440,
  height: 900,
  storagePath,
});

describe("TLOZ attachment snapshots", () => {
  it("keeps keys idempotent, replaces the complete group, and rejects an older generation", async () => {
    const client = createMockDataClient();
    const missionId = "mission-resources";
    const first = await client.tloz.prepareAttachmentBatch(missionId, "pr-57", "0123456789abcdef0123456789abcdef01234567", [file("home-desktop", "v1-home")]);
    const repeated = await client.tloz.prepareAttachmentBatch(missionId, "pr-57", first.sourceRevision, [file("home-desktop", "ignored-new-path")]);
    expect(repeated.uploadBatchId).toBe(first.uploadBatchId);
    const firstResult = await client.tloz.finalizeAttachmentBatch(first.uploadBatchId);
    const homeId = firstResult.group.attachments[0]?.id;
    expect(homeId).toBeTruthy();

    const second = await client.tloz.prepareAttachmentBatch(missionId, "pr-57", "fedcba9876543210fedcba9876543210fedcba98", [file("home-desktop", "v2-home"), file("checkout-mobile", "v2-checkout")]);
    const third = await client.tloz.prepareAttachmentBatch(missionId, "pr-57", "abcdefabcdefabcdefabcdefabcdefabcdefabcd", [file("home-desktop", "v3-home")]);
    await expect(client.tloz.finalizeAttachmentBatch(second.uploadBatchId)).rejects.toBeInstanceOf(TlozAttachmentBatchSupersededError);
    const thirdResult = await client.tloz.finalizeAttachmentBatch(third.uploadBatchId);
    expect(thirdResult.group.attachments.map((attachment) => attachment.externalKey)).toEqual(["home-desktop"]);
    expect(thirdResult.group.attachments.find((attachment) => attachment.externalKey === "home-desktop")?.id).toBe(homeId);
    expect((await client.tloz.finalizeAttachmentBatch(third.uploadBatchId)).group.attachments).toHaveLength(1);
  });
});
