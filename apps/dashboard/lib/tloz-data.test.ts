import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMissionDetail: vi.fn(),
  getAttachmentGroups: vi.fn(),
  createSignedRead: vi.fn(),
}));

vi.mock("react", () => ({ cache: <T extends (...args: never[]) => unknown>(callback: T) => callback }));
vi.mock("@zipform/data", () => ({ dataClient: { tloz: mocks } }));
vi.mock("./tloz-attachment-storage", () => ({ getTlozAttachmentStorage: () => ({ createSignedRead: mocks.createSignedRead }) }));

import { hydrateTlozMissionResources } from "./tloz-data";

describe("hydrateTlozMissionResources", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds signed URLs to attachment resources for the TLO-0064 preview", async () => {
    const mission = { resources: [{ id: "resource-1", type: "image", title: "Capture", url: undefined }] } as never;
    const groups = [{ attachments: [{ id: "resource-1", storagePath: "missions/1/capture/file.png" }] }] as never;

    await expect(hydrateTlozMissionResources(mission, groups, async (path) => `https://signed.test/${path}`)).resolves.toMatchObject({
      resources: [{ id: "resource-1", url: "https://signed.test/missions/1/capture/file.png" }],
    });
  });

  it("keeps the resource usable when storage signing is temporarily unavailable", async () => {
    const mission = { resources: [{ id: "resource-1", type: "image", title: "Capture" }] } as never;
    const groups = [{ attachments: [{ id: "resource-1", storagePath: "missions/1/capture/file.png" }] }] as never;

    await expect(hydrateTlozMissionResources(mission, groups, async () => { throw new Error("storage unavailable"); })).resolves.toMatchObject({
      resources: [{ id: "resource-1" }],
    });
  });
});
