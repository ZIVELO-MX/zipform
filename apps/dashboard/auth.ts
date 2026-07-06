import { getPrismaClient } from "@zipform/data";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyPassword } from "./lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email o usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!identifier || !password) return null;

        const user = await getPrismaClient().user.findFirst({
          where: { OR: [{ email: identifier }, { username: identifier }] }
        });
        if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl };
      }
    }),
    {
      id: "zoho",
      name: "Zoho",
      type: "oidc",
      issuer: "https://accounts.zoho.com",
      clientId: process.env.ZOHO_CLIENT_ID,
      clientSecret: process.env.ZOHO_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
      profile(profile: Record<string, unknown>) {
        return {
          id: String(profile.sub ?? profile.ZSOID ?? profile.email ?? ""),
          name: String(profile.name ?? profile.display_name ?? profile.First_Name ?? profile.email ?? ""),
          email: String(profile.email ?? "").toLowerCase(),
          image: null
        };
      }
    }
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "zoho") return true;
      if (!user.email) return false;
      return Boolean(await getPrismaClient().user.findUnique({ where: { email: user.email.toLowerCase() } }));
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (!email) return token;

      const dbUser = await getPrismaClient().user.findUnique({ where: { email: email.toLowerCase() } });
      if (dbUser) {
        token.sub = dbUser.id;
        token.name = dbUser.name;
        token.role = dbUser.role;
        token.type = dbUser.type;
        token.username = dbUser.username;
        token.avatarUrl = dbUser.avatarUrl;
      }
      return token;
    }
  }
});
