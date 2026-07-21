import { type NextRequest, NextResponse } from "next/server";
import { dataClient } from "@zipform/data";
import type { UserProfile } from "@zipform/types";
import { auth } from "../auth";
import { authorizeApiRequest } from "./authorization";

type AuthResult =
  | { user: UserProfile }
  | Response;

function authenticated(user: UserProfile, request: NextRequest): AuthResult {
  return authorizeApiRequest(request, user) ?? { user };
}

function unauthorizedResponse() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa o un API key válido.", requestId: crypto.randomUUID() } },
    { status: 401 },
  );
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== null) {
    if (!authHeader.startsWith("Bearer ")) return unauthorizedResponse();
    const apiKey = authHeader.slice(7).trim();
    if (apiKey) {
      const localKey = process.env.ZIPFORM_LOCAL_API_KEY;
      const localMode = process.env.ZIPFORM_DATA_DRIVER === "mock" && process.env.ZIPFORM_LOCAL_API_MODE === "1" && process.env.VERCEL !== "1";
      if (localMode && localKey && apiKey === localKey) {
        const users = await dataClient.tloz.getUsers();
        const localUserId = process.env.ZIPFORM_LOCAL_API_USER_ID ?? "owner";
        const localUser = users.find((candidate) => candidate.id === localUserId);
        if (localUser) return authenticated(localUser, request);
      }

      const user = await dataClient.agent.authenticateWithApiKey(apiKey);
      if (user) return authenticated(user, request);
    }
    return unauthorizedResponse();
  }

  const session = await auth();
  if (session?.user?.email) {
    const users = await dataClient.tloz.getUsers();
    const user = users.find(
      (candidate) => candidate.email.trim().toLowerCase() === session.user.email!.toLowerCase()
    );
    if (user) return authenticated(user, request);
  }

  return unauthorizedResponse();
}
