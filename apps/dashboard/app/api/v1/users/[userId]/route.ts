import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { dataClient } from "@zipform/data";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa.", requestId: crypto.randomUUID() } },
      { status: 401 }
    );
  }

  const { userId } = await params;

  if (!userId || userId.length < 1 || userId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "userId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const users = await dataClient.tloz.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Usuario no encontrado.", requestId: crypto.randomUUID() } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: user });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
