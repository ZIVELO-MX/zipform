import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth);
  const isLogin = request.nextUrl.pathname === "/login";
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (!isLoggedIn && !isLogin) {
    if (isApi) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Se requiere una sesión activa.", requestId: crypto.randomUUID() } },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLogin) return NextResponse.redirect(new URL("/", request.nextUrl));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
