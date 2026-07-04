import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { dataClient } from "@zipform/data";

export async function GET(_request: Request, { params }: { params: Promise<{ missionId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa.", requestId: crypto.randomUUID() } },
      { status: 401 }
    );
  }

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
