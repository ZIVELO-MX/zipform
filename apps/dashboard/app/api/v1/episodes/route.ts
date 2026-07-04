import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { dataClient } from "@zipform/data";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa.", requestId: crypto.randomUUID() } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get("seasonId");

  try {
    const all = await dataClient.tloz.getEpisodes();
    const data = seasonId ? all.filter((e) => e.seasonId === seasonId) : all;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
