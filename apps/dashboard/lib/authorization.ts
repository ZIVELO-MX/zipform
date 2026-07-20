import type { UserProfile } from "@zipform/types";

export const READ_ONLY_AGENT_ROLE = "agent:reader" as const;

export function isReadOnlyAgent(user: { type: string; role: string }) {
  return user.type === "agent" && user.role === READ_ONLY_AGENT_ROLE;
}

export type PublicUserProfile = Omit<UserProfile, "email">;

export function toPublicUserProfile(user: UserProfile): PublicUserProfile {
  const { email: _email, ...publicUser } = user;
  return publicUser;
}

export function forbiddenResponse() {
  return Response.json(
    { error: { code: "FORBIDDEN", message: "El agente no tiene permisos para esta operación.", requestId: crypto.randomUUID() } },
    { status: 403 },
  );
}

const TLOZ_API_PREFIXES = [
  "/api/v1/missions",
  "/api/v1/projects",
  "/api/v1/quest-items",
  "/api/v1/resources",
  "/api/v1/seasons",
  "/api/v1/episodes",
  "/api/v1/users",
] as const;

function isTlozReadPath(pathname: string) {
  return TLOZ_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function authorizeApiRequest(request: Request, user: UserProfile) {
  if (!isReadOnlyAgent(user)) return null;

  const pathname = new URL(request.url).pathname.replace(/\/$/, "");
  const isQueryEndpoint = pathname.endsWith("/query");
  const isReadOperation = request.method === "GET" || isQueryEndpoint;

  if (isTlozReadPath(pathname) && isReadOperation) return null;
  return forbiddenResponse();
}
