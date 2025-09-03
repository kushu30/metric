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
          const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"));
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
    async jwt({ token, user, trigger, session }) {
      // Handle session updates
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      // Initial sign-in
      if (user) {
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
        token.role = dbUser?.role || null;
        token.sub = user.id; // Use `sub` for the user ID
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };