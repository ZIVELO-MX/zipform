"use server";

import type { ApiKey, Avatar, UserProfile } from "@tloz/types";
import { auth } from "../auth";
import { dataClient, type UserUpdateInput } from "@tloz/data";
import { revalidatePath } from "next/cache";
import { assertTlozOperation, authorizeTlozOperation, isReadOnlyAgent, TlozAuthorizationError } from "./authorization";

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

async function assertAgentTarget(agentId: string) {
  const agents = await dataClient.agent.list();
  if (!agents.some((agent) => agent.id === agentId)) throw new TlozAuthorizationError("FORBIDDEN", 403);
}

async function assertOwnApiKeyAccess() {
  const session = await auth();
  if (!session?.user?.id) throw new TlozAuthorizationError("UNAUTHORIZED", 401);
  if (!authorizeTlozOperation(session.user, "manage-own-api-keys", { targetUserId: session.user.id }).allowed) {
    throw new TlozAuthorizationError("FORBIDDEN", 403);
  }
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
  await assertAgentTarget(agentId);

  return dataClient.agent.listApiKeys(agentId);
}

export async function listOwnApiKeys(): Promise<ApiKey[]> {
  const session = await assertOwnApiKeyAccess();
  return dataClient.agent.listApiKeys(session.id);
}

export type CreateApiKeyResult = {
  key: string;
  apiKey: ApiKey;
};

export async function createAgentApiKey(agentId: string, name: string): Promise<CreateApiKeyResult> {
  const session = await assertAdminAccess();
  await assertAgentTarget(agentId);

  const result = await dataClient.agent.createApiKey(agentId, name, session.id);
  revalidatePath("/", "layout");
  return result;
}

export async function createOwnApiKey(name: string): Promise<CreateApiKeyResult> {
  const session = await assertOwnApiKeyAccess();
  const result = await dataClient.agent.createApiKey(session.id, name, session.id);
  revalidatePath("/", "layout");
  return result;
}

export async function revokeAgentApiKey(agentId: string, keyId: string): Promise<void> {
  await assertAdminAccess();
  await assertAgentTarget(agentId);

  const revoked = await dataClient.agent.revokeApiKey(keyId, agentId);
  if (!revoked) throw new TlozAuthorizationError("FORBIDDEN", 403);
  revalidatePath("/", "layout");
}

export async function revokeOwnApiKey(keyId: string): Promise<void> {
  const session = await assertOwnApiKeyAccess();
  const revoked = await dataClient.agent.revokeApiKey(keyId, session.id);
  if (!revoked) throw new TlozAuthorizationError("FORBIDDEN", 403);
  revalidatePath("/", "layout");
}
