import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../lib/api-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const auth = await authenticateRequest(_request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { projectId } = await params;

  if (!projectId || projectId.length < 1 || projectId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "projectId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const projects = await dataClient.tloz.getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Proyecto no encontrado.", requestId: crypto.randomUUID() } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: project });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
