import { type NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { UserProfile } from "@zipform/types";
import { auth } from "../auth";

type AuthResult =
  | { user: UserProfile }
  | Response;

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7).trim();
    if (apiKey) {
      const user = await dataClient.agent.authenticateWithApiKey(apiKey);
      if (user) return { user };
    }
  }

  const session = await auth();
  if (session?.user?.email) {
    const users = await dataClient.tloz.getUsers();
    const user = users.find(
      (candidate) => candidate.email.trim().toLowerCase() === session.user.email!.toLowerCase()
    );
    if (user) return { user };
  }

  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa o un API key válido.", requestId: crypto.randomUUID() } },
    { status: 401 }
  );
}
