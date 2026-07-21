import type { UserProfile } from "@zipform/types";

export const PLATFORM_OWNER_ROLE = "Platform Owner" as const;
export const FULL_STACK_DEVELOPER_ROLE = "Full Stack Developer" as const;
export const OPERATIVE_AGENT_ROLE = "agent:operative" as const;
export const READ_ONLY_AGENT_ROLE = "agent:reader" as const;

type Actor = { id: string; type: string; role: string };

export type TlozOperation =
  | "read"
  | "read-sensitive-user"
  | "mutate"
  | "create"
  | "update"
  | "move"
  | "structure"
  | "delete-mission"
  | "admin";

export type TlozAuthorizationContext = {
  ownerId?: string | null;
  requestedOwnerId?: string | null;
};

export type TlozAuthorizationDecision =
  | { allowed: true }
  | { allowed: false; code: "FORBIDDEN"; status: 403 };

export class TlozAuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHORIZED" | "FORBIDDEN",
    public readonly status: 401 | 403,
  ) {
    super(code === "UNAUTHORIZED"
      ? "Se requiere una sesión activa o un API key válido."
      : "No tienes permisos para esta operación.");
    this.name = "TlozAuthorizationError";
  }
}

function roleOf(actor: Actor) {
  if (actor.type === "human" && actor.role === PLATFORM_OWNER_ROLE) return "owner" as const;
  if (actor.type === "human" && actor.role === FULL_STACK_DEVELOPER_ROLE) return "developer" as const;
  if (actor.type === "agent" && actor.role === OPERATIVE_AGENT_ROLE) return "operative" as const;
  if (actor.type === "agent" && actor.role === READ_ONLY_AGENT_ROLE) return "reader" as const;
  return "unknown" as const;
}

export function isPlatformOwner(actor: Actor) {
  return roleOf(actor) === "owner";
}

export function isFullStackDeveloper(actor: Actor) {
  return roleOf(actor) === "developer";
}

export function isReadOnlyAgent(actor: Actor) {
  return roleOf(actor) === "reader";
}

export function authorizeTlozOperation(
  actor: Actor,
  operation: TlozOperation,
  context: TlozAuthorizationContext = {},
): TlozAuthorizationDecision {
  const role = roleOf(actor);
  if (role === "unknown") return { allowed: false, code: "FORBIDDEN", status: 403 };

  if (operation === "read") return { allowed: true };
  if (operation === "read-sensitive-user") {
    return role === "reader" ? { allowed: false, code: "FORBIDDEN", status: 403 } : { allowed: true };
  }
  if (operation === "admin" || operation === "delete-mission") {
    return role === "owner" ? { allowed: true } : { allowed: false, code: "FORBIDDEN", status: 403 };
  }
  if (role === "reader") return { allowed: false, code: "FORBIDDEN", status: 403 };
  if (operation === "mutate") return { allowed: true };
  if (operation === "structure" || operation === "move") {
    return role === "owner" || role === "operative"
      ? { allowed: true }
      : { allowed: false, code: "FORBIDDEN", status: 403 };
  }
  if (role === "owner" || role === "operative") return { allowed: true };
  if (operation === "create") {
    return context.requestedOwnerId === actor.id
      ? { allowed: true }
      : { allowed: false, code: "FORBIDDEN", status: 403 };
  }
  if (operation === "update") {
    return context.ownerId === actor.id
      ? { allowed: true }
      : { allowed: false, code: "FORBIDDEN", status: 403 };
  }
  return { allowed: false, code: "FORBIDDEN", status: 403 };
}

export function assertTlozOperation(actor: Actor, operation: TlozOperation, context?: TlozAuthorizationContext) {
  const decision = authorizeTlozOperation(actor, operation, context);
  if (!decision.allowed) throw new TlozAuthorizationError(decision.code, decision.status);
}

export type PublicUserProfile = Omit<UserProfile, "email">;

export function toPublicUserProfile(user: UserProfile): PublicUserProfile {
  const { email: _email, ...publicUser } = user;
  return publicUser;
}

export function toPublicMissionOwner<T extends { owner: UserProfile }>(mission: T) {
  return { ...mission, owner: toPublicUserProfile(mission.owner) };
}

export function forbiddenResponse() {
  return Response.json(
    { error: { code: "FORBIDDEN", message: "No tienes permisos para esta operación.", requestId: crypto.randomUUID() } },
    { status: 403 },
  );
}

export function authorizeApiOperation(actor: Actor, operation: TlozOperation, context?: TlozAuthorizationContext) {
  return authorizeTlozOperation(actor, operation, context).allowed ? null : forbiddenResponse();
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

function isTlozPath(pathname: string) {
  return TLOZ_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function authorizeApiRequest(request: Request, actor: Actor) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "");
  if (pathname === "/api/v1/agents" || pathname.startsWith("/api/v1/agents/")) {
    return authorizeApiOperation(actor, "admin");
  }
  if (!isTlozPath(pathname)) return isReadOnlyAgent(actor) ? forbiddenResponse() : null;

  const isReadOperation = request.method === "GET" || pathname.endsWith("/query");
  return authorizeApiOperation(actor, isReadOperation ? "read" : "mutate");
}
