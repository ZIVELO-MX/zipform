import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { toPublicUserProfile } from "../../../../../lib/authorization";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  return NextResponse.json({ data: auth.user.type === "agent" && auth.user.role === "agent:reader" ? toPublicUserProfile(auth.user) : auth.user });
}
