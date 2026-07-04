import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { dataClient } from "@zipform/data";
import type { TlozProjectStatus } from "@zipform/types";

async function authenticate() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa.", requestId: crypto.randomUUID() } },
      { status: 401 }
    );
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = await authenticate();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const status = searchParams.get("status");
  const limitParam = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  if (status && !["planned", "active", "archived"].includes(status)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "status debe ser planned, active o archived.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam))) : 25;
  if (isNaN(limit)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "limit debe ser un número entre 1 y 100.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const result = await dataClient.tloz.findProjects(
      { ownerId: ownerId ?? undefined, status: (status as TlozProjectStatus) ?? undefined },
      { limit, cursor: cursor ?? undefined }
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
