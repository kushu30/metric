// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { SiweMessage } from "siwe";

// --- START DIAGNOSTIC LOGS ---
console.log("\nSERVER-SIDE AUTH CONFIGURATION CHECK:");
console.log(
  `GOOGLE_CLIENT_ID loaded: ${!!process.env.GOOGLE_CLIENT_ID}`
);
console.log(
  `GOOGLE_CLIENT_SECRET loaded: ${!!process.env.GOOGLE_CLIENT_SECRET}`
);
// --- END DIAGNOSTIC LOGS ---

// ✅ Export options separately so getServerSession can use it
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
    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.sub;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// ✅ Pass options into NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
