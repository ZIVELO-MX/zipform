import { createHash } from "node:crypto";
import { dataClient, type TlozActivityEvent, type TlozMissionRecord } from "@tloz/data";

type MissionIdentity = Pick<TlozMissionRecord, "id" | "displayId">;

type RecordMissionActivityInput = {
  mission: MissionIdentity;
  actorId: string;
  action: string;
  source: TlozActivityEvent["source"];
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
};

export async function recordMissionActivity(input: RecordMissionActivityInput) {
  const content = await dataClient.containerContent?.getContent(input.mission.id);
  const rawKey = input.idempotencyKey?.trim();
  const idempotencyKey = rawKey
    ? createHash("sha256")
      .update(`${input.source}:${input.actorId}:${input.action}:${input.mission.id}:${rawKey}`)
      .digest("hex")
    : undefined;

  return dataClient.activity?.append({
    contentId: content?.id,
    entityType: "mission",
    entityId: input.mission.id,
    entityPublicId: input.mission.displayId,
    actorId: input.actorId,
    action: input.action,
    source: input.source,
    metadata: input.metadata,
    idempotencyKey,
  });
}

export const missionActivityLabels: Record<string, string> = {
  "mission.created": "Misión creada",
  "mission.updated": "Misión actualizada",
  "mission.deleted": "Misión eliminada",
  "mission.status_changed": "Estado actualizado",
  "mission.document_updated": "Documento actualizado",
  "mission.dependency_added": "Dependencia agregada",
  "mission.dependency_removed": "Dependencia eliminada",
  "mission.quest_item_set": "Quest item actualizado",
  "mission.quest_item_removed": "Quest item eliminado",
  "mission.resource_added": "Recurso agregado",
  "mission.resource_removed": "Recurso eliminado",
  "mission.attachments_updated": "Evidencia actualizada",
};
