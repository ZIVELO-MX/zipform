import { dataClient, type TlozMissionDetail } from "@zipform/data";
import type { TlozProject, TlozQuestItem } from "@zipform/types";
import { authorizeApiOperation, type TlozOperation } from "./authorization";

type Actor = { id: string; type: string; role: string };
type EntityAuthorization<T> = { allowed: true; entity: T } | { allowed: false; response: Response };

function notFoundResponse(message: string) {
  return Response.json(
    { error: { code: "NOT_FOUND", message, requestId: crypto.randomUUID() } },
    { status: 404 },
  );
}

export async function authorizeMissionOperation(actor: Actor, missionId: string, operation: TlozOperation = "update"): Promise<EntityAuthorization<TlozMissionDetail>> {
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) return { allowed: false, response: notFoundResponse("Misión no encontrada.") };
  const response = authorizeApiOperation(actor, operation, { ownerId: mission.ownerId });
  return response ? { allowed: false, response } : { allowed: true, entity: mission };
}

export async function authorizeProjectOperation(actor: Actor, projectId: string, operation: TlozOperation = "update"): Promise<EntityAuthorization<TlozProject>> {
  const project = (await dataClient.tloz.getProjects()).find((candidate) => candidate.id === projectId);
  if (!project) return { allowed: false, response: notFoundResponse("Proyecto no encontrado.") };
  const response = authorizeApiOperation(actor, operation, { ownerId: project.ownerId });
  return response ? { allowed: false, response } : { allowed: true, entity: project };
}

export async function authorizeQuestItemOperation(actor: Actor, questItemId: string, operation: TlozOperation = "update"): Promise<EntityAuthorization<TlozQuestItem>> {
  const questItem = (await dataClient.tloz.getQuestItems()).find((candidate) => candidate.id === questItemId);
  if (!questItem) return { allowed: false, response: notFoundResponse("Quest item no encontrado.") };
  const response = authorizeApiOperation(actor, operation, { ownerId: questItem.ownerId });
  return response ? { allowed: false, response } : { allowed: true, entity: questItem };
}
