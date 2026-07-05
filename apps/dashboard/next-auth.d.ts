import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      type: string;
      username: string;
      avatarUrl: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    type?: string;
    username?: string;
    avatarUrl?: string;
  }
}
