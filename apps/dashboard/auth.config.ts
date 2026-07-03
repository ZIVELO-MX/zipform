import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : "";
        session.user.username = typeof token.username === "string" ? token.username : "";
        session.user.avatarUrl = typeof token.avatarUrl === "string" ? token.avatarUrl : "";
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  trustHost: true
};
