import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string | null;
      hasOnboarded?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string | null;
    hasOnboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role?: string | null;
    hasOnboarded?: boolean;
  }
}
