import { dataClient, TlozDocumentError } from "@tloz/data";
import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { handleDocumentError } from "../../../../../lib/document-api";

type RouteContext = { params: Promise<{ definitionKey: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0]);
  if (auth instanceof Response) return auth;
  const { definitionKey } = await params;
  if (!definitionKey || definitionKey.length > 160) {
    return NextResponse.json({
      error: {
        code: "INVALID_REQUEST",
        message: "definitionKey inválido.",
        requestId: crypto.randomUUID(),
      },
    }, { status: 400 });
  }

  try {
    const definition = await dataClient.documents.getDefinition(definitionKey);
    if (!definition) {
      throw new TlozDocumentError(
        "DOCUMENT_NOT_FOUND",
        `La definición ${definitionKey} no existe.`,
      );
    }
    return NextResponse.json({ data: definition }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return handleDocumentError(error);
  }
}
