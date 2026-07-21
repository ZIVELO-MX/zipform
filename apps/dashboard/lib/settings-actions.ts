"use server";

import type { ApiKey, Avatar, UserProfile } from "@zipform/types";
import { auth } from "../auth";
import { dataClient, type UserUpdateInput } from "@zipform/data";
import { revalidatePath } from "next/cache";
import { assertTlozOperation, isReadOnlyAgent, TlozAuthorizationError } from "./authorization";

async function assertSettingsAccess() {
  const session = await auth();
  if (!session?.user?.id) throw new TlozAuthorizationError("UNAUTHORIZED", 401);
  if (isReadOnlyAgent(session.user)) throw new TlozAuthorizationError("FORBIDDEN", 403);
  return session.user;
}

async function assertAdminAccess() {
  const session = await auth();
  if (!session?.user?.id) throw new TlozAuthorizationError("UNAUTHORIZED", 401);
  assertTlozOperation(session.user, "admin");
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
  await assertAdminAccess();

  return dataClient.agent.list();
}

export async function listAgentApiKeys(agentId: string): Promise<ApiKey[]> {
  await assertAdminAccess();

  return dataClient.agent.listApiKeys(agentId);
}

export type CreateApiKeyResult = {
  key: string;
  apiKey: ApiKey;
};

export async function createAgentApiKey(agentId: string, name: string): Promise<CreateApiKeyResult> {
  const session = await assertAdminAccess();

  const result = await dataClient.agent.createApiKey(agentId, name, session.id);
  revalidatePath("/", "layout");
  return result;
}

export async function revokeAgentApiKey(keyId: string): Promise<void> {
  await assertAdminAccess();

  await dataClient.agent.revokeApiKey(keyId);
  revalidatePath("/", "layout");
}
