import { NextResponse } from "next/server";
import { dataClient } from "@tloz/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { isReadOnlyAgent, toPublicMissionOwner } from "../../../../../lib/authorization";
import { observedJson } from "../../../../../lib/read-telemetry";

type BatchBody = { ids?: unknown };

function invalid(message: string) {
  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message, requestId: crypto.randomUUID() } },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  let body: BatchBody;
  try {
    body = await request.json() as BatchBody;
  } catch {
    return invalid("Cuerpo de solicitud inválido.");
  }

  if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > 8) {
    return invalid("ids debe contener entre 1 y 8 identificadores.");
  }
  if (body.ids.some((id) => typeof id !== "string" || id.length < 1 || id.length > 128)) {
    return invalid("Cada identificador debe ser un string válido.");
  }
  const ids = body.ids as string[];
  if (new Set(ids.map((id) => id.toLowerCase())).size !== ids.length) {
    return invalid("ids no admite identificadores duplicados.");
  }

  try {
    const missions = await dataClient.tloz.getMissionDetails(ids);
    const payload = {
      data: missions.map((mission, index) => mission
        ? { id: ids[index], data: isReadOnlyAgent(auth.user) ? toPublicMissionOwner(mission) : mission }
        : { id: ids[index], error: { code: "NOT_FOUND", message: "Misión no encontrada." } }),
    };
    return observedJson({ request, actorId: auth.user.id, operation: "missions.batch", payload, startedAt });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
