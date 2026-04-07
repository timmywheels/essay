import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  providers: [GitHub],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith("/dashboard")) return isLoggedIn;
      return true;
    },
  },
};
