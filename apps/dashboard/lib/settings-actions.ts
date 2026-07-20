"use server";

import type { ApiKey, Avatar, UserProfile } from "@zipform/types";
import { auth } from "../auth";
import { dataClient, type UserUpdateInput } from "@zipform/data";
import { revalidatePath } from "next/cache";
import { isReadOnlyAgent } from "./authorization";

async function assertSettingsAccess() {
  const session = await auth();
  if (!session?.user?.id || isReadOnlyAgent(session.user)) throw new Error("No autorizado");
  return session.user;
}

export async function updateProfile(input: UserUpdateInput & { avatarUrl?: string }) {
  const session = await assertSettingsAccess();

  const user = await dataClient.user.update(session.id, input);
  revalidatePath("/", "layout");
  return user;
}

export async function listAvatars(): Promise<Avatar[]> {
  await assertSettingsAccess();

  return dataClient.platform.listAvatars();
}

export async function listAgents(): Promise<UserProfile[]> {
  await assertSettingsAccess();

  return dataClient.agent.list();
}

export async function listAgentApiKeys(agentId: string): Promise<ApiKey[]> {
  await assertSettingsAccess();

  return dataClient.agent.listApiKeys(agentId);
}

export type CreateApiKeyResult = {
  key: string;
  apiKey: ApiKey;
};

export async function createAgentApiKey(agentId: string, name: string): Promise<CreateApiKeyResult> {
  const session = await assertSettingsAccess();

  const result = await dataClient.agent.createApiKey(agentId, name, session.id);
  revalidatePath("/", "layout");
  return result;
}

export async function revokeAgentApiKey(keyId: string): Promise<void> {
  await assertSettingsAccess();

  await dataClient.agent.revokeApiKey(keyId);
  revalidatePath("/", "layout");
}
