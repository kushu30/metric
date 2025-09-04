// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { SiweMessage } from "siwe";
import { ObjectId } from "mongodb";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          const siwe = new SiweMessage(
            JSON.parse(credentials?.message || "{}")
          );
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL as string);
          const result = await siwe.verify({
            signature: credentials?.signature || "",
            domain: nextAuthUrl.host,
          });
          if (result.success) {
            return { id: siwe.address };
          }
          return null;
        } catch (e) {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // This callback is crucial for keeping the session token in sync with the database.
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, populate the token with user data.
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.hasOnboarded = user.hasOnboarded;
      }
      
      // When the session is updated (e.g., after role selection),
      // re-fetch the user from the DB to ensure the token is always fresh.
      if (trigger === "update" && token.sub) {
        const client = await clientPromise;
        const db = client.db();
        const freshUser = await db.collection("users").findOne({ _id: new ObjectId(token.sub) });

        if (freshUser) {
            token.role = freshUser.role;
            token.hasOnboarded = !!freshUser.role; // A user with a role has been onboarded.
        }
      }
      return token;
    },
    // This callback makes the token data available on the client-side session object.
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.hasOnboarded = token.hasOnboarded;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
