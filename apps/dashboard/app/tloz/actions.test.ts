import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidatePath: vi.fn(),
  getTlozMissionDetailWithAttachments: vi.fn(),
  tloz: {
    getMissionDetail: vi.fn(),
    getMissions: vi.fn(),
    getProjects: vi.fn(),
    getSeasons: vi.fn(),
    getEpisodes: vi.fn(),
    getQuestItems: vi.fn(),
    getResources: vi.fn(),
    getUsers: vi.fn(),
    createMission: vi.fn(),
    updateMission: vi.fn(),
    createProject: vi.fn(),
    createQuestItem: vi.fn(),
    updateProject: vi.fn(),
    updateQuestItem: vi.fn(),
    createSeason: vi.fn(),
    createEpisode: vi.fn(),
    saveMissionDocument: vi.fn(),
    addMissionDependency: vi.fn(),
    removeMissionDependency: vi.fn(),
    setMissionQuestItem: vi.fn(),
    removeMissionQuestItem: vi.fn(),
    addMissionResource: vi.fn(),
    removeMissionResource: vi.fn(),
    addProjectResource: vi.fn(),
    removeProjectResource: vi.fn(),
    addQuestItemResource: vi.fn(),
    removeQuestItemResource: vi.fn(),
    patchMissionStatus: vi.fn(),
    deleteMission: vi.fn(),
  },
}));

vi.mock("../../auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@zipform/data", () => ({ dataClient: { tloz: mocks.tloz } }));
vi.mock("../../lib/tloz-data", () => ({
  getTlozMissionDetailWithAttachments: mocks.getTlozMissionDetailWithAttachments,
}));

import {
  createMission,
  createSeason,
  deleteMission,
  getMissionDetailOptions,
  saveMissionDocument,
  updateMission,
} from "./actions";

const owner = { id: "owner-1", type: "human", role: "Platform Owner" };
const developer = { id: "developer-1", type: "human", role: "Full Stack Developer" };
const operative = { id: "operative-1", type: "agent", role: "agent:operative" };
const reader = { id: "reader-1", type: "agent", role: "agent:reader" };

const publicOwner = {
  id: "developer-1",
  name: "Developer",
  username: "developer",
  email: "developer@zipform.dev",
  role: "Full Stack Developer",
  type: "human",
  avatarUrl: "",
  theme: "system",
};

const mission = { id: "mission-1", ownerId: "developer-1", owner: publicOwner, resources: [] };
const createInput = { title: "Mission", type: "side_quest", ownerId: "developer-1", projectId: "project-1" } as const;

describe("TLOZ Server Action authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tloz.getMissionDetail.mockResolvedValue(mission);
    mocks.tloz.getMissions.mockResolvedValue([mission]);
    mocks.tloz.getProjects.mockResolvedValue([]);
    mocks.tloz.getSeasons.mockResolvedValue([]);
    mocks.tloz.getEpisodes.mockResolvedValue([]);
    mocks.tloz.getQuestItems.mockResolvedValue([]);
    mocks.tloz.getResources.mockResolvedValue([]);
    mocks.tloz.getUsers.mockResolvedValue([publicOwner]);
    mocks.tloz.createMission.mockResolvedValue(mission);
    mocks.tloz.updateMission.mockResolvedValue(mission);
  });

  it("allows a developer to create and edit owned Missions", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    await expect(createMission(createInput as never)).resolves.toEqual(mission);
    await expect(updateMission("mission-1", { title: "Updated" })).resolves.toEqual(mission);
    expect(mocks.tloz.createMission).toHaveBeenCalledOnce();
    expect(mocks.tloz.updateMission).toHaveBeenCalledOnce();
  });

  it("denies developer mutations of other owners and placement changes without side effects", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    mocks.tloz.getMissionDetail.mockResolvedValue({ ...mission, ownerId: "owner-1" });
    await expect(saveMissionDocument("mission-1", "# Changed"))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.tloz.saveMissionDocument).not.toHaveBeenCalled();

    mocks.tloz.getMissionDetail.mockResolvedValue(mission);
    await expect(updateMission("mission-1", { projectId: "project-2" }))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.tloz.updateMission).not.toHaveBeenCalled();
  });

  it("denies developer creation for another owner before persistence", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    await expect(createMission({ ...createInput, ownerId: "owner-1" } as never))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.tloz.createMission).not.toHaveBeenCalled();
  });

  it("allows operative global updates and Mission deletion", async () => {
    mocks.auth.mockResolvedValue({ user: operative });
    mocks.tloz.getMissionDetail.mockResolvedValue({ ...mission, ownerId: "owner-1" });
    await expect(updateMission("mission-1", { ownerId: "developer-1" })).resolves.toEqual(mission);
    await expect(deleteMission("mission-1")).resolves.toBeUndefined();
    expect(mocks.tloz.deleteMission).toHaveBeenCalledWith("mission-1");

    mocks.auth.mockResolvedValue({ user: owner });
    await deleteMission("mission-1");
    expect(mocks.tloz.deleteMission).toHaveBeenCalledWith("mission-1");
  });

  it("restricts structural writes to Platform Owners and operative agents", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    await expect(createSeason("Season II"))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.tloz.createSeason).not.toHaveBeenCalled();

    mocks.auth.mockResolvedValue({ user: operative });
    mocks.tloz.createSeason.mockResolvedValue({ id: "season-2" });
    await expect(createSeason("Season II")).resolves.toEqual({ id: "season-2" });
  });

  it("returns sanitized global options to readers and rejects mutations", async () => {
    mocks.auth.mockResolvedValue({ user: reader });
    const options = await getMissionDetailOptions();
    expect(options.users[0]).not.toHaveProperty("email");
    expect(options.missions[0].owner).not.toHaveProperty("email");

    await expect(createMission({ ...createInput, ownerId: reader.id } as never))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.tloz.createMission).not.toHaveBeenCalled();
  });

  it("uses an explicit 401 error when no session exists", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(getMissionDetailOptions())
      .rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    expect(mocks.tloz.getUsers).not.toHaveBeenCalled();
  });
});
