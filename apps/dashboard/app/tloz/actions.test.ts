import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidatePath: vi.fn(),
  getTlozMissionDetailWithAttachments: vi.fn(),
  documents: {
    get: vi.fn(),
    getDefinition: vi.fn(),
    update: vi.fn(),
    replaceProjectContract: vi.fn(),
  },
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
vi.mock("@tloz/data", () => ({
  dataClient: { tloz: mocks.tloz, documents: mocks.documents },
  validateDocumentProperties: vi.fn(),
}));
vi.mock("../../lib/tloz-data", () => ({
  getTlozMissionDetailWithAttachments: mocks.getTlozMissionDetailWithAttachments,
}));

import {
  createMission,
  deleteMission,
  getDocumentDetailOptions,
  getMissionCapabilities,
  getMissionDetailOptions,
  patchMissionStatus,
  saveMissionDocument,
  updateDocument,
  updateDocumentContent,
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
  email: "developer@tloz.dev",
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
    mocks.documents.get.mockResolvedValue(null);
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

  it("accepts only Mission values declared by the Project contract", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    mocks.documents.get.mockResolvedValue({
      kind: "project",
      contract: {
        fields: [
          { key: "status", options: [{ value: "in_progress" }] },
          { key: "category", options: [{ value: "engineering" }] },
        ],
      },
    });

    await expect(createMission({
      ...createInput,
      status: "in_progress",
      type: "engineering",
    } as never)).resolves.toEqual(mission);
    await expect(createMission({
      ...createInput,
      status: "unknown",
      type: "engineering",
    } as never)).rejects.toThrow("contrato");
  });

  it("persists custom Mission properties after validating the Project contract", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    mocks.documents.get
      .mockResolvedValueOnce({
        kind: "project",
        contract: {
          fields: [
            { key: "status", options: [{ value: "next" }] },
            { key: "category", options: [{ value: "side_quest" }] },
            { key: "priority", options: [{ value: "high" }] },
          ],
        },
      })
      .mockResolvedValueOnce({ id: "document-1", revision: 1 });
    mocks.documents.update.mockResolvedValue({ id: "document-1", revision: 2 });

    await createMission(createInput as never, { priority: "high" });

    expect(mocks.tloz.createMission).toHaveBeenCalledWith({
      ...createInput,
      status: "next",
    });
    expect(mocks.documents.update).toHaveBeenCalledWith(
      "document-1",
      { properties: { priority: "high" } },
      1,
    );
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

  it("uses the Project status role to complete a Mission", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    mocks.tloz.getMissionDetail.mockResolvedValue({ ...mission, projectId: "project-1" });
    mocks.documents.get.mockResolvedValue({
      kind: "project",
      contract: {
        fields: [{
          key: "status",
          options: [{ value: "shipped", role: "done" }],
        }],
      },
    });

    await patchMissionStatus("mission-1", "shipped" as never);

    expect(mocks.tloz.updateMission).toHaveBeenCalledWith("mission-1", {
      status: "shipped",
      completedAt: expect.any(String),
    });
  });

  it("inherits valid defaults when a Mission moves to another Project", async () => {
    mocks.auth.mockResolvedValue({ user: operative });
    mocks.tloz.getMissionDetail.mockResolvedValue({
      ...mission,
      projectId: "project-old",
      status: "old-status",
      type: "old-category",
    });
    mocks.documents.get.mockResolvedValue({
      kind: "project",
      contract: {
        fields: [
          {
            key: "status",
            defaultValue: "queue",
            options: [
              { value: "queue", role: "backlog" },
              { value: "shipped", role: "done" },
            ],
          },
          {
            key: "category",
            defaultValue: "engineering",
            options: [{ value: "engineering" }],
          },
        ],
      },
    });

    await updateMission("mission-1", { projectId: "project-new" });

    expect(mocks.tloz.updateMission).toHaveBeenCalledWith("mission-1", {
      projectId: "project-new",
      status: "queue",
      type: "engineering",
      completedAt: undefined,
    });
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

  it("resolves Mission attachment capabilities from role and ownership", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    mocks.tloz.getMissionDetail.mockResolvedValue({ ...mission, ownerId: developer.id });
    await expect(getMissionCapabilities("mission-1")).resolves.toEqual({ canUpdate: true, canMove: false });

    mocks.auth.mockResolvedValue({ user: reader });
    await expect(getMissionCapabilities("mission-1")).resolves.toEqual({ canUpdate: false, canMove: false });

    mocks.auth.mockResolvedValue({ user: developer });
    mocks.tloz.getMissionDetail.mockResolvedValue({ ...mission, ownerId: "owner-1" });
    await expect(getMissionCapabilities("mission-1")).resolves.toEqual({ canUpdate: false, canMove: false });
  });

  it("loads the matching definition for a document detail", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    const document = {
      id: "inventory-document",
      publicId: "inventory-item",
      kind: "inventory",
      properties: { assignee: developer.id },
      source: { type: "inventory", id: "inventory-1" },
    };
    const definition = { id: "inventory-definition", key: "inventory", kind: "inventory" };
    mocks.documents.get.mockResolvedValue(document);
    mocks.documents.getDefinition.mockResolvedValue(definition);
    mocks.tloz.getQuestItems.mockResolvedValue([{ id: "inventory-1", ownerId: developer.id }]);

    await expect(getDocumentDetailOptions("inventory-document")).resolves.toEqual({
      document,
      definition,
      contract: [],
      capabilities: { canUpdate: true, canMove: false },
    });
    expect(mocks.documents.getDefinition).toHaveBeenCalledWith("inventory");
  });

  it("updates common document content with the expected revision", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    const document = {
      id: "project-document",
      kind: "project",
      revision: 4,
      properties: { owner: developer.id },
      source: { type: "project", id: "project-1" },
    };
    const updated = { ...document, title: "Updated", revision: 5 };
    mocks.documents.get.mockResolvedValue(document);
    mocks.documents.update.mockResolvedValue(updated);
    mocks.tloz.getProjects.mockResolvedValue([{ id: "project-1", ownerId: developer.id }]);

    await expect(updateDocumentContent(document.id, { title: "Updated" }, 4)).resolves.toEqual(updated);
    expect(mocks.documents.update).toHaveBeenCalledWith(document.id, { title: "Updated" }, 4);
  });

  it("uses the document repository for Mission-native fields", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    const document = {
      id: "mission-document",
      kind: "mission",
      revision: 3,
      properties: { assignee: developer.id },
      source: { type: "mission", id: "mission-1" },
    };
    mocks.documents.get.mockResolvedValue(document);
    mocks.documents.update.mockResolvedValue({
      ...document,
      revision: 4,
      title: "Updated",
      properties: { ...document.properties, status: "now" },
    });

    await updateMission("mission-1", { title: "Updated", status: "now" });

    expect(mocks.documents.update).toHaveBeenCalledWith(
      document.id,
      { title: "Updated", properties: { status: "now" } },
      3,
    );
    expect(mocks.tloz.updateMission).not.toHaveBeenCalled();
  });

  it("requires move capability for a document owner change", async () => {
    mocks.auth.mockResolvedValue({ user: developer });
    const document = {
      id: "project-document",
      kind: "project",
      revision: 1,
      properties: { owner: developer.id },
      source: { type: "project", id: "project-1" },
    };
    mocks.documents.get.mockResolvedValue(document);

    await expect(updateDocument(document.id, {
      properties: { owner: owner.id },
    }, 1)).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.documents.update).not.toHaveBeenCalled();
  });

  it("uses an explicit 401 error when no session exists", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(getMissionDetailOptions())
      .rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    expect(mocks.tloz.getUsers).not.toHaveBeenCalled();
  });
});
