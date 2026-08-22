import { describe, expect, it } from "vitest";
import { createMockDataClient } from "./mock";
import { missions, projects, questItems } from "../seed-data";

describe("mock document repository", () => {
  it("projects legacy entities into the shared document model", async () => {
    const client = createMockDataClient();
    const project = projects[0];
    const mission = missions.find((candidate) => candidate.projectId === project.id)!;
    const projectedProject = await client.documents.get(`project-${project.slug}`);
    const projectedMission = await client.documents.get(mission.displayId);
    const inventory = await client.documents.find({ kind: "inventory" }, { limit: 100 });

    expect(projectedProject).toMatchObject({
      kind: "project",
      publicId: `project-${project.slug}`,
      title: project.name,
      contract: {
        fields: [
          expect.objectContaining({ key: "status", type: "select", required: true }),
          expect.objectContaining({ key: "category", type: "select", required: true }),
        ],
      },
    });
    expect(projectedMission).toMatchObject({
      kind: "mission",
      publicId: mission.displayId,
      parentPublicId: `project-${project.slug}`,
      properties: {
        status: mission.status,
        category: mission.type,
      },
    });
    expect(await client.documents.get(project.id)).toMatchObject({ publicId: `project-${project.slug}` });
    expect(await client.documents.get(mission.id)).toMatchObject({ publicId: mission.displayId });
    expect(inventory.data).toHaveLength(questItems.length);
    expect(inventory.data[0].publicId).toMatch(/^INV-\d{4}$/);
  });

  it("updates a document with optimistic revision checks and preserves custom values", async () => {
    const client = createMockDataClient();
    const source = missions[0];
    const document = (await client.documents.get(source.displayId))!;
    const project = (await client.documents.get(document.parentPublicId!))!;

    await client.documents.replaceProjectContract(project.id, [
      ...project.contract!.fields,
      {
        id: "priority",
        key: "priority",
        label: "Prioridad",
        type: "select",
        required: false,
        visible: true,
        position: 2,
        options: [
          { value: "normal", label: "Normal" },
          { value: "high", label: "Alta" },
        ],
      },
    ], project.revision);

    const updated = await client.documents.update(document.id, {
      title: "Documento actualizado",
      body: "## Criterios\n\n- [ ] Verificar",
      properties: { priority: "high" },
    }, document.revision);

    expect(updated).toMatchObject({
      title: "Documento actualizado",
      body: "## Criterios\n\n- [ ] Verificar",
      revision: document.revision + 1,
      properties: { priority: "high" },
    });
    expect(await client.tloz.getMissionDetail(source.id)).toMatchObject({
      title: "Documento actualizado",
      progress: 0,
      checklist: [expect.objectContaining({ title: "Verificar", completed: false })],
    });
    await expect(client.documents.update(document.id, { title: "Stale" }, document.revision))
      .rejects.toMatchObject({ code: "DOCUMENT_REVISION_CONFLICT" });

    const contractedProject = (await client.documents.get(project.id))!;
    const withoutPriority = contractedProject.contract!.fields.filter((field) => field.key !== "priority");
    const retired = await client.documents.replaceProjectContract(
      contractedProject.id,
      withoutPriority,
      contractedProject.revision,
    );
    expect((await client.documents.get(document.id))?.properties.priority).toBe("high");

    await client.documents.replaceProjectContract(retired.id, [
      ...retired.contract!.fields,
      {
        id: "priority-restored",
        key: "priority",
        label: "Prioridad",
        type: "select",
        required: true,
        visible: true,
        position: retired.contract!.fields.length,
        options: [
          { value: "normal", label: "Normal" },
          { value: "high", label: "Alta" },
        ],
      },
    ], retired.revision);
    expect((await client.documents.get(document.id))?.properties.priority).toBe("high");
  });

  it("projects responsible changes through kind-specific document keys", async () => {
    const client = createMockDataClient();
    const nextOwner = "responsible-user";
    const project = (await client.documents.find({ kind: "project" }, { limit: 20 })).data
      .find((document) => document.source)!;
    const inventory = (await client.documents.find({ kind: "inventory" }, { limit: 1 })).data[0];
    const mission = (await client.documents.find({ kind: "mission" }, { limit: 1 })).data[0];

    const updatedProject = await client.documents.update(project.id, {
      properties: { owner: nextOwner },
    }, project.revision);
    const updatedInventory = await client.documents.update(inventory.id, {
      properties: { assignee: nextOwner },
    }, inventory.revision);
    const updatedMission = await client.documents.update(mission.id, {
      properties: { assignee: nextOwner },
    }, mission.revision);

    expect(updatedProject.properties.owner).toBe(nextOwner);
    expect(updatedInventory.properties.assignee).toBe(nextOwner);
    expect(updatedMission.properties.assignee).toBe(nextOwner);
    expect((await client.tloz.getProjects()).find((item) => item.id === project.source!.id)?.ownerId)
      .toBe(nextOwner);
    expect((await client.tloz.getQuestItems()).find((item) => item.id === inventory.source!.id)?.ownerId)
      .toBe(nextOwner);
    expect((await client.tloz.getMissionDetail(mission.source!.id))?.ownerId).toBe(nextOwner);
  });

  it("advances cursor pagination without repeating records", async () => {
    const client = createMockDataClient();
    const first = await client.documents.find({}, { limit: 3 });
    const second = await client.documents.find({}, { limit: 3, cursor: first.nextCursor! });

    expect(first.data).toHaveLength(3);
    expect(second.data).toHaveLength(3);
    expect(second.data.map((document) => document.id)).not.toEqual(
      expect.arrayContaining(first.data.map((document) => document.id)),
    );
  });

  it("rejects missing document cursors instead of restarting at page one", async () => {
    const client = createMockDataClient();

    await expect(client.documents.find({}, { cursor: "missing" }))
      .rejects.toMatchObject({ name: "PaginationCursorError", cursor: "missing" });
  });

  it("preserves custom values without leaking them across Project contracts", async () => {
    const client = createMockDataClient();
    const mission = missions.find((candidate) => candidate.projectId === projects[0].id)!;
    const document = (await client.documents.get(mission.id))!;
    const originalProject = (await client.documents.get(projects[0].id))!;

    await client.documents.replaceProjectContract(originalProject.id, [
      ...originalProject.contract!.fields,
      {
        id: "priority",
        key: "priority",
        label: "Prioridad",
        type: "select",
        required: false,
        visible: true,
        position: 2,
        options: [{ value: "high", label: "Alta" }],
      },
    ], originalProject.revision);
    await client.documents.update(
      document.id,
      { properties: { priority: "high" } },
      document.revision,
    );

    await client.tloz.updateMission(mission.id, { projectId: projects[1].id });
    expect((await client.documents.get(mission.id))?.properties).not.toHaveProperty("priority");

    await client.tloz.updateMission(mission.id, { projectId: projects[0].id });
    expect((await client.documents.get(mission.id))?.properties).toMatchObject({ priority: "high" });
  });

  it("rejects status contracts without semantic roles", async () => {
    const client = createMockDataClient();
    const project = (await client.documents.find({ kind: "project" }, { limit: 10 })).data
      .find((document) => document.source);
    expect(project).toBeTruthy();

    await expect(client.documents.replaceProjectContract(project!.id, [{
      id: "status",
      key: "status",
      label: "Estado",
      type: "select",
      required: true,
      visible: true,
      position: 0,
      defaultValue: "todo",
      options: [{ value: "todo", label: "Todo" }],
    }], project!.revision)).rejects.toMatchObject({
      code: "DOCUMENT_INVALID",
      fields: { "contract.fields.status": "invalid" },
    });
  });

  it("rejects values outside the parent Project contract", async () => {
    const client = createMockDataClient();
    const mission = (await client.documents.find({ kind: "mission" }, { limit: 1 })).data[0];

    await expect(client.documents.update(
      mission.id,
      { properties: { status: "not-in-contract" } },
      mission.revision,
    )).rejects.toMatchObject({
      code: "DOCUMENT_INVALID",
      fields: { "properties.status": "invalid" },
    });

    await expect(client.documents.update(
      mission.id,
      { properties: { unknown_field: "value" } },
      mission.revision,
    )).rejects.toMatchObject({
      code: "DOCUMENT_INVALID",
      fields: { "properties.unknown_field": "unknown" },
    });

    await expect(client.documents.update(
      mission.id,
      { properties: { progress: 101 } },
      mission.revision,
    )).rejects.toMatchObject({
      code: "DOCUMENT_INVALID",
      fields: { "properties.progress": "invalid" },
    });
  });

  it("derives mission completion from the Project status role", async () => {
    const client = createMockDataClient();
    const mission = (await client.documents.find({ kind: "mission" }, { limit: 1 })).data[0];
    const project = (await client.documents.get(mission.parentId!))!;
    const status = project.contract!.fields.find((field) => field.key === "status")!;
    const category = project.contract!.fields.find((field) => field.key === "category")!;
    const contracted = await client.documents.replaceProjectContract(project.id, [
      {
        ...status,
        defaultValue: "queue",
        options: [
          { value: "queue", label: "Queue", role: "backlog" },
          { value: "shipped", label: "Shipped", role: "done" },
        ],
      },
      category,
    ], project.revision);

    const completed = await client.documents.update(
      mission.id,
      { properties: { status: "shipped" } },
      mission.revision,
    );
    expect((await client.tloz.getMissionDetail(mission.source!.id))?.completedAt).toBeTruthy();

    await client.documents.update(
      mission.id,
      { properties: { status: "queue" } },
      completed.revision,
    );
    expect((await client.tloz.getMissionDetail(mission.source!.id))?.completedAt).toBeUndefined();
    expect(contracted.contract?.fields[0].options).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "shipped", role: "done" }),
    ]));
  });
});
