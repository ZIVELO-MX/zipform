import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { isReadOnlyAgent, toPublicUserProfile } from "../../../../../lib/authorization";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  return NextResponse.json({ data: isReadOnlyAgent(auth.user) ? toPublicUserProfile(auth.user) : auth.user });
}
