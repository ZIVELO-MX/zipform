import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozMissionStatus } from "@zipform/types";
import { authenticateRequest } from "../../../../../lib/api-auth";

const VALID_MISSION_FIELDS = new Set([
  "title", "description", "icon", "type", "status", "conclusion",
  "dueDate", "startDate", "completedAt", "blockedReason", "progress",
  "seasonId", "episodeId", "ownerId", "projectId"
]);

const VALID_STATUSES: TlozMissionStatus[] = ["now", "next", "later", "completed", "blocked"];

export async function GET(_request: Request, { params }: { params: Promise<{ missionId: string }> }) {
  const auth = await authenticateRequest(_request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId } = await params;

  if (!missionId || missionId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const detail = await dataClient.tloz.getMissionDetail(missionId);
    if (!detail) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Misión no encontrada.", requestId: crypto.randomUUID() } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: detail });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ missionId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId } = await params;
  if (!missionId || missionId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const allowedFields = Object.fromEntries(
    Object.entries(body).filter(([key]) => VALID_MISSION_FIELDS.has(key))
  );

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "No se proporcionaron campos válidos para actualizar.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (allowedFields.status && !VALID_STATUSES.includes(allowedFields.status as TlozMissionStatus)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser: now, next, later, completed o blocked.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const existing = await dataClient.tloz.getMissionDetail(missionId);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Misión no encontrada.", requestId: crypto.randomUUID() } },
        { status: 404 }
      );
    }

    const updated = await dataClient.tloz.updateMission(missionId, allowedFields);
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message || "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ missionId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId } = await params;
  if (!missionId || missionId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    await dataClient.tloz.deleteMission(missionId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message || "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
