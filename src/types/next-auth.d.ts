import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string | null;
      role?: string | null; // Add the role property
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string | null; // Add the role property to the JWT token
  }
}