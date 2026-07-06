import { NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { TlozResourceType } from "@zipform/types";
import { authenticateRequest } from "../../../../../../lib/api-auth";

const VALID_TYPES: TlozResourceType[] = ["link", "document", "image", "file", "note"];

export async function POST(request: Request, { params }: { params: Promise<{ missionId: string }> }) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;

  const { missionId } = await params;
  if (!missionId || missionId.length > 128) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "missionId inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  let body: { type?: string; title?: string; url?: string; fileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Cuerpo de solicitud inválido.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  if (!body.type || !VALID_TYPES.includes(body.type as TlozResourceType) || !body.title) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "type (link|document|image|file|note) y title son requeridos.", requestId: crypto.randomUUID() } },
      { status: 400 }
    );
  }

  try {
    const detail = await dataClient.tloz.addMissionResource(
      missionId,
      { type: body.type as TlozResourceType, title: body.title, url: body.url, fileId: body.fileId }
    );
    return NextResponse.json({ data: detail });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message || "Error interno del servidor.", requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}
