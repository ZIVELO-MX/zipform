"use server";

import type { ApiKey, UserProfile } from "@zipform/types";
import { auth } from "../auth";
import { dataClient, type UserUpdateInput } from "@zipform/data";
import { revalidatePath } from "next/cache";

export async function updateProfile(input: UserUpdateInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const user = await dataClient.user.update(session.user.id, input);
  revalidatePath("/", "layout");
  return user;
}

export async function listAgents(): Promise<UserProfile[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  return dataClient.agent.list();
}

export async function listAgentApiKeys(agentId: string): Promise<ApiKey[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  return dataClient.agent.listApiKeys(agentId);
}

export type CreateApiKeyResult = {
  key: string;
  apiKey: ApiKey;
};

export async function createAgentApiKey(agentId: string, name: string): Promise<CreateApiKeyResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const result = await dataClient.agent.createApiKey(agentId, name, session.user.id);
  revalidatePath("/", "layout");
  return result;
}

export async function revokeAgentApiKey(keyId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  await dataClient.agent.revokeApiKey(keyId);
  revalidatePath("/", "layout");
}
