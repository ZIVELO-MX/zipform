import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { dataClient } from "@zipform/data";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa.", requestId: crypto.randomUUID() } },
      { status: 401 }
    );
  }

  try {
    const data = await dataClient.tloz.getSeasons();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
