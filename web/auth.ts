import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db as any),
  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (profile?.login && user.id) {
        const existing = await db.user.findUnique({ where: { id: user.id } });
        if (existing && !existing.githubUsername) {
          await db.user.update({
            where: { id: user.id },
            data: { githubUsername: profile.login as string },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        const dbUser = await db.user.findUnique({ where: { id: user.id } });
        token.username = dbUser?.username ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = (token.username as string | null) ?? null;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
    } & Omit<import("next-auth").DefaultSession["user"], "id">;
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    username: string | null;
  }
}
