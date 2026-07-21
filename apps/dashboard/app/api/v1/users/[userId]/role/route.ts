import { NextRequest, NextResponse } from "next/server";
import { dataClient, type UserRole } from "@zipform/data";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import { authorizeApiOperation } from "../../../../../../lib/authorization";

const HUMAN_ROLES = new Set<UserRole>(["Platform Owner", "Full Stack Developer"]);
const AGENT_ROLES = new Set<UserRole>(["agent:operative", "agent:reader"]);

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, requestId: crypto.randomUUID() } }, { status });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { userId } = await params;
  if (!userId || userId.length > 128) return errorResponse(400, "INVALID_REQUEST", "userId inválido.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "El cuerpo debe ser JSON válido.");
  }
  const role = typeof body === "object" && body !== null && "role" in body
    ? (body as { role?: unknown }).role
    : undefined;
  const validRoles: UserRole[] = ["Platform Owner", "Full Stack Developer", "agent:operative", "agent:reader"];
  if (typeof role !== "string" || !validRoles.includes(role as UserRole)) {
    return errorResponse(400, "INVALID_REQUEST", "role no es válido.");
  }

  try {
    const users = await dataClient.tloz.getUsers();
    const target = users.find((user) => user.id === userId);
    if (!target) return errorResponse(404, "NOT_FOUND", "Usuario no encontrado.");

    const forbidden = authorizeApiOperation(auth.user, "manage-roles", {
      targetUserId: target.id,
      targetIsPlatformOwner: target.role === "Platform Owner",
    });
    if (forbidden) return forbidden;

    const compatible = target.type === "human" ? HUMAN_ROLES.has(role as UserRole) : AGENT_ROLES.has(role as UserRole);
    if (!compatible) return errorResponse(400, "INVALID_REQUEST", "El rol no es compatible con el tipo de usuario.");

    const ownerCount = users.filter((user) => user.role === "Platform Owner").length;
    if (target.role === "Platform Owner" && role !== "Platform Owner" && ownerCount <= 1) {
      return errorResponse(409, "LAST_OWNER", "No se puede eliminar al último Platform Owner.");
    }

    const updated = await dataClient.tloz.updateUserRole(userId, role as UserRole);
    return NextResponse.json({ data: updated });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Error interno del servidor.");
  }
}
