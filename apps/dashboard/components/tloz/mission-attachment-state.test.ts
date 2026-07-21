import { describe, expect, it } from "vitest";
import { createAttachmentKey, createAttachmentRevision } from "../../lib/tloz-attachments-client";
import { attachmentStateReducer, emptyAttachmentState, failedAttachmentKeys, allAttachmentsUploaded } from "./mission-attachment-state";

function item(key: string) {
  const file = new File([key], `${key}.png`, { type: "image/png" });
  return { key, title: key, fileName: file.name, contentType: "image/png" as const, sizeBytes: file.size, width: 1, height: 1, file };
}

describe("mission attachment state", () => {
  it("keeps stable keys through replacement and retries only failures", () => {
    const first = item("desktop");
    const second = item("mobile");
    let state = attachmentStateReducer(emptyAttachmentState, { type: "select", groupKey: "manual-group", sourceRevision: createAttachmentRevision(), items: [first, second] });
    state = attachmentStateReducer(state, { type: "prepared", uploadBatchId: "batch-1" });
    state = attachmentStateReducer(state, { type: "uploaded", key: "desktop" });
    state = attachmentStateReducer(state, { type: "file-error", key: "mobile", message: "falló" });
    expect([...failedAttachmentKeys(state)]).toEqual(["mobile"]);
    expect(state.items.find((item) => item.key === "desktop")?.status).toBe("uploaded");
    state = attachmentStateReducer(state, { type: "replace-item", key: "mobile", item: item("replacement") });
    expect(state.items.find((item) => item.key === "mobile")?.fileName).toBe("replacement.png");
    expect(state.items.find((item) => item.key === "mobile")?.status).toBe("pending");
    expect(allAttachmentsUploaded(state)).toBe(false);
  });

  it("does not finalize a batch until every item is uploaded", () => {
    let state = attachmentStateReducer(emptyAttachmentState, { type: "select", groupKey: "manual-group", sourceRevision: "a".repeat(40), items: [item(createAttachmentKey("one.png")), item(createAttachmentKey("two.png"))] });
    state = attachmentStateReducer(state, { type: "uploaded", key: state.items[0]!.key });
    expect(allAttachmentsUploaded(state)).toBe(false);
    state = attachmentStateReducer(state, { type: "uploaded", key: state.items[1]!.key });
    expect(allAttachmentsUploaded(state)).toBe(true);
  });
});
